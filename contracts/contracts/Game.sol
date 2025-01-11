// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Game is ReentrancyGuard {
    address public immutable owner;
    uint256 public immutable deploymentTime;

    bool public gameEnded;

    address[] public teamAddresses;
    mapping(address => uint256) public teamShares;

    uint256 public prizePool;
    uint256 public currentFee;

    mapping(address => uint256) public userTotalPayments;
    address public lastPlayerAddress;
    uint256 public totalPayments;
    uint256 public lastPaymentTime;

    address[] public winnerAddresses;

    mapping(address => uint256) public unclaimedShares;
    mapping(address => bool) public paidUserShares;

    // Errors
    error NoTeamAddresses(); // No team addresses provided in the constructor
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

    // A winner is added
    event WinnerAdded(address indexed winnerAddress);

    // The prize is awarded to the winners
    event PrizeAwarded(address indexed winnerAddress, uint256 amount);

    // A team member's share is withdrawn
    event TeamShareWithdrawn(address indexed teamMemberAddress, uint256 amount);

    // An unclaimed user share is added
    event UnclaimedUserShareAdded(address indexed userAddress, uint256 amount);

    // An unclaimed user share is claimed
    event UnclaimedUserShareClaimed(
        address indexed userAddress,
        uint256 amount
    );

    // A team member's share is increased
    event TeamShareIncreased(address indexed teamMember, uint256 amount);

    constructor(address[] memory _teamAddresses) {
        if (_teamAddresses.length == 0) revert NoTeamAddresses();

        for (uint i = 0; i < _teamAddresses.length; i++) {
            teamAddresses.push(_teamAddresses[i]);
        }

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
            userTotalPayments[msg.sender] += msg.value;
            totalPayments += msg.value;
        }

        emit FeePaymentReceived(
            msg.sender,
            msg.value,
            block.timestamp,
            userTotalPayments[msg.sender]
        );

        uint256 teamShare = (msg.value * 30) / 100;
        uint256 sharePerTeamMember = teamShare / teamAddresses.length;

        for (uint256 i = 0; i < teamAddresses.length; ) {
            teamShares[teamAddresses[i]] += sharePerTeamMember;
            emit TeamShareIncreased(teamAddresses[i], sharePerTeamMember);

            unchecked {
                ++i;
            }
        }

        unchecked {
            uint256 prizePoolShare = msg.value - teamShare;
            prizePool += prizePoolShare;
        }

        emit PrizePoolIncreased(prizePool);

        unchecked {
            uint256 newFeePrice = (currentFee * 10078) / 10000;
            uint256 maxFeePrice = 1 ether;
            currentFee = newFeePrice > maxFeePrice ? maxFeePrice : newFeePrice;
        }

        emit FeeIncreased(currentFee);
    }

    function addWinner(address winnerAddress) external nonReentrant {
        if (msg.sender != owner) revert NotOwner();
        if (prizePool == 0) revert EmptyPrizePool();

        for (uint256 i = 0; i < winnerAddresses.length; ) {
            if (winnerAddresses[i] == winnerAddress)
                revert WinnerAddressAlreadyAdded();

            unchecked {
                ++i;
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

        for (uint256 i = 0; i < winnerAddresses.length; ) {
            if (_sendUserShare(payable(winnerAddresses[i]), prizeShare)) {
                emit PrizeAwarded(winnerAddresses[i], prizeShare);
            }

            unchecked {
                ++i;
            }
        }
    }

    function claimUserShare() external nonReentrant {
        if (userTotalPayments[msg.sender] == 0) revert NoFeePaymentMade();

        if (paidUserShares[msg.sender] == true)
            revert UserShareAlreadyClaimed();

        uint256 unclaimedAmount = unclaimedShares[msg.sender];
        if (unclaimedAmount > 0) {
            unclaimedShares[msg.sender] = 0;
            if (_sendUserShare(payable(msg.sender), unclaimedAmount)) {
                emit UnclaimedUserShareClaimed(msg.sender, unclaimedAmount);
                return;
            }
        }

        if (gameEnded) revert GameHasEnded();
        if (prizePool == 0) revert EmptyPrizePool();
        if (block.timestamp < lastPaymentTime + 30 days)
            revert TimeNotElapsed();

        uint256 lastPlayerShare = (prizePool * 10) / 100;
        uint256 remainingPrize = prizePool - lastPlayerShare;

        if (msg.sender == lastPlayerAddress) {
            if (_sendUserShare(payable(msg.sender), lastPlayerShare)) {
                emit UnclaimedUserShareClaimed(msg.sender, lastPlayerShare);
                return;
            }
        } else {
            uint256 userShare = (remainingPrize *
                userTotalPayments[msg.sender]) / totalPayments;

            if (_sendUserShare(payable(msg.sender), userShare)) {
                emit UnclaimedUserShareClaimed(msg.sender, userShare);
                return;
            }
        }
    }

    function withdrawTeamShare() external nonReentrant {
        uint256 amount = teamShares[msg.sender];
        if (amount == 0) revert NoTeamShareToWithdraw();

        teamShares[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            teamShares[msg.sender] = amount;
            revert TeamShareWithdrawFailed();
        }

        emit TeamShareWithdrawn(msg.sender, amount);
    }

    function getUserTotalPayments(
        address user
    ) external view returns (uint256) {
        return userTotalPayments[user];
    }

    function _sendUserShare(
        address payable recipient,
        uint256 amount
    ) private returns (bool) {
        (bool success, ) = recipient.call{value: amount}("");
        if (!success) {
            unclaimedShares[recipient] = amount;
            emit UnclaimedUserShareAdded(recipient, amount);
        } else {
            paidUserShares[recipient] = true;
        }

        return success;
    }
}
