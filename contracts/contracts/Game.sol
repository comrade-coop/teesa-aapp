// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Game is ReentrancyGuard {
    address public immutable owner;
    address public immutable teamAddress;
    uint256 public immutable deploymentTime;

    bool public gameEnded;

    uint256 public teamShare;
    uint256 public prizePool;
    uint256 public currentFee;

    mapping(address => uint256) public totalPaymentsPerUser;
    uint256 public totalPayments;
    address public lastPlayerAddress;
    uint256 public lastPaymentTime;

    address[] public winnerAddresses;

    mapping(address => uint256) public unclaimedShares;

    bool public abandonedGame;
    mapping(address => bool) public claimedAbandonedGameUserShares;

    // Errors
    error InvalidTeamAddress(); // Team address is zero
    error InsufficientFeePayment(); // The fee payment is insufficient
    error NotOwner(); // The caller is not the owner
    error EmptyPrizePool(); // The prize pool is empty
    error WinnerAddressAlreadyAdded(); // The winner address is already added
    error GameHasEnded(); // The game has ended
    error GameNotEnded(); // The game has not ended
    error NoTeamShareToWithdraw(); // No team share to withdraw
    error TeamShareWithdrawFailed(); // The team share withdraw failed
    error AbandonedGameTimeNotElapsed(); // The time has not elapsed
    error NoFeePaymentMade(); // The user has not made any fee payment
    error UserShareAlreadyClaimed(); // The user share is already claimed
    error NoUnclaimedShares(); // The user has no unclaimed shares
    error NotTeamAddress(); // The caller is not the team address
    error AbondonedGameUserShareAlreadyClaimed(); // The abandoned game user share is already claimed
    error GameWasAbandoned(); // The game was abandoned

    // Events
    // A new user fee payment is received
    event FeePaymentReceived(
        address indexed user,
        uint256 amount,
        uint256 timestamp,
        uint256 userTotalPayments
    );

    // The prize pool is increased
    event PrizePoolIncreased(uint256 newPrizePool);

    // The fee is increased
    event FeeIncreased(uint256 newFee);

    // The game ended - when the first winner is added
    event GameEnded();

    // The game is abandoned
    event GameAbandoned();

    // A winner is added
    event WinnerAdded(address indexed winnerAddress);

    // The prize is awarded to the winners
    event PrizeAwarded(uint256 amount, address[] winnerAddresses);

    // The team share is withdrawn
    event TeamShareWithdrawn(uint256 amount);

    // An unclaimed user share is added
    event UnclaimedUserShareAdded(address indexed userAddress, uint256 amount);

    // An unclaimed user share is claimed
    event UserShareSent(address indexed userAddress, uint256 amount);

    // The team share is increased
    event TeamShareIncreased(uint256 amount);

    // An abandoned game user share is claimed
    event AbandonedGameUserShareClaimed(
        address indexed userAddress,
        uint256 amount,
        bool isLastPlayer
    );

    constructor(address _teamAddress) {
        if (_teamAddress == address(0)) revert InvalidTeamAddress();

        teamAddress = _teamAddress;
        gameEnded = false;
        currentFee = 0.001 ether;
        owner = msg.sender;
        deploymentTime = block.timestamp;
        lastPaymentTime = block.timestamp;
        abandonedGame = false;
    }

    function payFee() external payable nonReentrant {
        if (gameEnded) revert GameHasEnded();
        if (abandonedGame) revert GameWasAbandoned();
        if (msg.value < currentFee) revert InsufficientFeePayment();

        lastPlayerAddress = msg.sender;
        lastPaymentTime = block.timestamp;

        unchecked {
            totalPaymentsPerUser[msg.sender] += msg.value;
            totalPayments += msg.value;
        }

        emit FeePaymentReceived(
            msg.sender,
            msg.value,
            block.timestamp,
            totalPaymentsPerUser[msg.sender]
        );

        unchecked {
            uint256 teamShareAmount = (msg.value * 30) / 100;
            teamShare += teamShareAmount;

            uint256 prizePoolShare = msg.value - teamShareAmount;
            prizePool += prizePoolShare;
        }

        emit TeamShareIncreased(teamShare);

        emit PrizePoolIncreased(prizePool);

        unchecked {
            uint256 newFeePrice = (currentFee * 101) / 100;
            uint256 maxFeePrice = 1 ether;
            currentFee = newFeePrice > maxFeePrice ? maxFeePrice : newFeePrice;
        }

        emit FeeIncreased(currentFee);
    }

    function addWinner(address winnerAddress) external nonReentrant {
        if (msg.sender != owner) revert NotOwner();
        if (abandonedGame) revert GameWasAbandoned();
        if (prizePool == 0) revert EmptyPrizePool();

        for (uint256 i = 0; i < winnerAddresses.length; i++) {
            if (winnerAddresses[i] == winnerAddress) {
                revert WinnerAddressAlreadyAdded();
            }
        }

        if (!gameEnded) {
            gameEnded = true;
            emit GameEnded();
        }

        winnerAddresses.push(winnerAddress);

        emit WinnerAdded(winnerAddress);
    }

    function setPrize() external nonReentrant {
        if (msg.sender != owner) revert NotOwner();
        if (!gameEnded) revert GameNotEnded();
        if (prizePool == 0) revert EmptyPrizePool();

        uint256 prizeShare = prizePool / winnerAddresses.length;
        prizePool = 0;

        emit PrizeAwarded(prizePool, winnerAddresses);

        for (uint256 i = 0; i < winnerAddresses.length; i++) {
            _allocateUserShare(payable(winnerAddresses[i]), prizeShare);
        }
    }

    function awardPrize() external nonReentrant {
        if (msg.sender != owner) revert NotOwner();
        if (!gameEnded) revert GameNotEnded();

        for (uint256 i = 0; i < winnerAddresses.length; i++) {
            _sendUserShare(payable(winnerAddresses[i]));
        }
    }

    function claimAbandonedGameShare() external nonReentrant {
        if (totalPaymentsPerUser[msg.sender] == 0) revert NoFeePaymentMade();
        if (claimedAbandonedGameUserShares[msg.sender] == true)
            revert AbondonedGameUserShareAlreadyClaimed();
        if (prizePool == 0) revert EmptyPrizePool();
        if (!abondoneGameTimeElapsed()) revert AbandonedGameTimeNotElapsed();

        if (!abandonedGame) {
            abandonedGame = true;
            emit GameAbandoned();
        }

        uint256 lastPlayerShare = (prizePool * 10) / 100;
        uint256 remainingPrize = prizePool - lastPlayerShare;

        bool isLastPlayer = msg.sender == lastPlayerAddress;
        uint256 shareAmount = isLastPlayer
            ? lastPlayerShare
            : (remainingPrize * totalPaymentsPerUser[msg.sender]) /
                totalPayments;

        emit AbandonedGameUserShareClaimed(
            msg.sender,
            shareAmount,
            isLastPlayer
        );

        _allocateUserShare(payable(msg.sender), shareAmount);
        claimedAbandonedGameUserShares[msg.sender] = true;
        _sendUserShare(payable(msg.sender));
    }

    function claimUserShare() external nonReentrant {
        uint256 unclaimedAmount = unclaimedShares[msg.sender];
        if (unclaimedAmount == 0) revert NoUnclaimedShares();

        _sendUserShare(payable(msg.sender));
        unclaimedShares[msg.sender] = 0;
    }

    function withdrawTeamShare() external nonReentrant {
        if (msg.sender != teamAddress) revert NotTeamAddress();
        if (teamShare == 0) revert NoTeamShareToWithdraw();

        uint256 amount = teamShare;
        teamShare = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            teamShare = amount;
            revert TeamShareWithdrawFailed();
        }

        emit TeamShareWithdrawn(amount);
    }

    function abondoneGameTimeElapsed() public view returns (bool) {
        return block.timestamp >= lastPaymentTime + 3 days;
    }

    function _allocateUserShare(
        address payable recipient,
        uint256 amount
    ) private {
        unclaimedShares[recipient] = amount;
        emit UnclaimedUserShareAdded(recipient, amount);
    }

    function _sendUserShare(address payable recipient) private returns (bool) {
        uint256 amount = unclaimedShares[recipient];
        unclaimedShares[recipient] = 0;

        (bool success, ) = recipient.call{value: amount}("");
        if (success) {
            emit UserShareSent(recipient, amount);
        } else {
            unclaimedShares[recipient] = amount;
        }

        return success;
    }
}
