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
    address public lastPlayerAddress;
    uint256 public totalPayments;
    uint256 public lastPaymentTime;

    address[] public winnerAddresses;

    mapping(address => uint256) public unclaimedShares;
    mapping(address => bool) public paidUserShares;

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
    error TimeNotElapsed(); // The time has not elapsed
    error NoFeePaymentMade(); // The user has not made any fee payment
    error UserShareAlreadyClaimed(); // The user share is already claimed
    error ClaimUserShareFailed(); // Add this line
    error NoUnclaimedShares(); // Add this line
    error NotTeamAddress(); // The caller is not the team address

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
    event PrizeAwarded(uint256 amount, uint16 winnerCount);

    // The team share is withdrawn
    event TeamShareWithdrawn(uint256 amount);

    // An unclaimed user share is added
    event UnclaimedUserShareAdded(address indexed userAddress, uint256 amount);

    // An unclaimed user share is claimed
    event UserShareSent(
        address indexed userAddress,
        uint256 amount
    );

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
    }

    function payFee() external payable nonReentrant {
        if (gameEnded) revert GameHasEnded();
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

        uint256 teamShareAmount = (msg.value * 30) / 100;
        teamShare += teamShareAmount;
        emit TeamShareIncreased(teamShareAmount);

        unchecked {
            uint256 prizePoolShare = msg.value - teamShareAmount;
            prizePool += prizePoolShare;
        }

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

    function awardPrize() external nonReentrant {
        if (msg.sender != owner) revert NotOwner();
        if (!gameEnded) revert GameNotEnded();
        if (prizePool == 0) revert EmptyPrizePool();

        uint256 prizeShare = prizePool / winnerAddresses.length;
        prizePool = 0;

        emit PrizeAwarded(prizePool, uint16(winnerAddresses.length));

        for (uint256 i = 0; i < winnerAddresses.length; i++) {
            _allocateUserShare(payable(winnerAddresses[i]), prizeShare);
        }

        for (uint256 i = 0; i < winnerAddresses.length; i++) {
            _sendUserShare(payable(winnerAddresses[i]), prizeShare);
        }
    }

    function claimUserShare() external nonReentrant {
        uint256 unclaimedAmount = unclaimedShares[msg.sender];
        if (unclaimedAmount > 0) {
            (bool success, ) = payable(msg.sender).call{value: unclaimedAmount}("");
            if (success) {
                unclaimedShares[msg.sender] = 0;
                emit UserShareSent(msg.sender, unclaimedAmount);
            }
            else{
                revert ClaimUserShareFailed();
            }
        }
        else{
            revert NoUnclaimedShares();
        }
    }

    function claimAbandonedGameShare() external nonReentrant {
        if (totalPaymentsPerUser[msg.sender] == 0) revert NoFeePaymentMade();
        if (paidUserShares[msg.sender] == true) revert UserShareAlreadyClaimed();
        if (prizePool == 0) revert EmptyPrizePool();
        if (block.timestamp < lastPaymentTime + 3 days) revert TimeNotElapsed();

        if (!gameEnded) {
            gameEnded = true;
            emit GameAbandoned();
            emit GameEnded();
        }

        uint256 lastPlayerShare = (prizePool * 10) / 100;
        uint256 remainingPrize = prizePool - lastPlayerShare;

        bool isLastPlayer = msg.sender == lastPlayerAddress;
        uint256 shareAmount = isLastPlayer 
            ? lastPlayerShare 
            : (remainingPrize * totalPaymentsPerUser[msg.sender]) / totalPayments;

        emit AbandonedGameUserShareClaimed(msg.sender, shareAmount, isLastPlayer);
        _sendOrAllocateUserShare(payable(msg.sender), shareAmount);
        paidUserShares[msg.sender] = true;
    }

    function _allocateUserShare(address payable recipient, uint256 amount) private {
        unclaimedShares[recipient] += amount;
        emit UnclaimedUserShareAdded(recipient, amount);
    }

    function _sendUserShare(
        address payable recipient,
        uint256 amount
    ) private returns (bool) {
        (bool success, ) = recipient.call{value: amount}("");
        if (success) {
            unclaimedShares[recipient] = 0;
            emit UserShareSent(recipient, amount);  
        } 
        return success;
    }

    function _sendOrAllocateUserShare(address payable recipient, uint256 amount) private {
        bool success = _sendUserShare(recipient, amount);
        if (!success) {
            _allocateUserShare(recipient, amount);
        }
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

    function getUserTotalPayments(
        address user
    ) external view returns (uint256) {
        return totalPaymentsPerUser[user];
    }
}
