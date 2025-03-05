// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/*
 * # Overview:
 *
 * Constructor:
 *   - teamAddress: The address of the team multi-sig wallet
 *
 * PayFee:
 *   - The user pays a fee to play the game
 *   - The fee is split into:
 *     - 20% to the team
 *     - 80% to the prize pool
 *   - The fee is increased by 1%, till a cap of 1 ether is reached
 *
 * SetWinner:
 *   - The owner sets the winner address
 *   - The game is ended
 *
 * AwardPrize:
 *   - The owner sends the prize to the winner
 *
 * ClaimAbandonedGameShare:
 *   - If no message is sent within 3 days, the game is abandoned -> the game ends
 *   - The users can claim the abandoned game shares:
 *     - If the user is the last player, they receive the bigger of:
 *         - 10% of the prize pool
 *         - Share of the prize pool, proportional to their paid fees
 *     - The other players receive the remaining prize pool split proportionally to their paid fees
 *
 * ClaimUserShare:
 *   - In case a payment to a user is reverted, the user share is added to the unclaimedShares
 *   - The user can claim their share of the prize pool
 *
 * WithdrawTeamShare:
 *   - The team can withdraw their share
 */

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

    address public winnerAddress;

    mapping(address => uint256) public unclaimedShares;

    mapping(address => bool) public claimedAbandonedGameUserShares;
    uint256 private abandonedGameLastPlayerShare;
    uint256 private abandonedGameRemainingPrize;
    
    // Errors
    error InvalidTeamAddress(); // Team address is zero
    error InsufficientFeePayment(); // The fee payment is insufficient
    error NotOwner(); // The caller is not the owner
    error EmptyPrizePool(); // The prize pool is empty
    error GameHasEnded(); // The game has ended
    error GameNotEnded(); // The game has not ended
    error NoTeamShareToWithdraw(); // No team share to withdraw
    error TeamShareWithdrawFailed(); // The team share withdraw failed
    error AbandonedGameTimeNotElapsed(); // The time has not elapsed
    error NoFeePaymentMade(); // The user has not made any fee payment
    error UserShareAlreadyClaimed(); // The user share is already claimed
    error NoUnclaimedShares(); // The user has no unclaimed shares
    error NotTeamAddress(); // The caller is not the team address
    error AbandonedGameUserShareAlreadyClaimed(); // The abandoned game user share is already claimed
    error InvalidWinnerAddress(); // The winner address is invalid
    error AbandonedGameTimeElapsed(); // The abandoned game time has elapsed

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
    event PrizeAwarded(uint256 amount, address winnerAddress);

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

    // Owner funds are transferred to the contract
    event OwnerFundsTransferred(uint256 amount);

    // The prize pool is funded directly
    event PrizePoolFunded(uint256 amount);

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
        if (abandonedGameTimeElapsed()) revert AbandonedGameTimeElapsed();

        lastPlayerAddress = msg.sender;
        lastPaymentTime = block.timestamp;

        totalPaymentsPerUser[msg.sender] += msg.value;
        totalPayments += msg.value;

        emit FeePaymentReceived(
            msg.sender,
            msg.value,
            block.timestamp,
            totalPaymentsPerUser[msg.sender]
        );

        uint256 teamShareAmount = (msg.value * 20) / 100;
        teamShare += teamShareAmount;

        uint256 prizePoolShare = msg.value - teamShareAmount;
        prizePool += prizePoolShare;

        emit TeamShareIncreased(teamShare);
        emit PrizePoolIncreased(prizePool);

        unchecked {
            uint256 newFeePrice = (currentFee * 101) / 100;
            uint256 maxFeePrice = 1 ether;
            currentFee = newFeePrice > maxFeePrice ? maxFeePrice : newFeePrice;
        }

        emit FeeIncreased(currentFee);
    }

    function setWinner(address _winnerAddress) external nonReentrant {
        if (msg.sender != owner) revert NotOwner();
        if (gameEnded) revert GameHasEnded();
        if (_winnerAddress == address(0)) revert InvalidWinnerAddress();

        gameEnded = true;
        emit GameEnded();

        winnerAddress = _winnerAddress;
        emit WinnerAdded(winnerAddress);
    }

    function awardPrize() external nonReentrant {
        if (!gameEnded) revert GameNotEnded();
        if (winnerAddress == address(0)) revert InvalidWinnerAddress();
        if (prizePool == 0) revert EmptyPrizePool();

        uint256 prizeAmount = prizePool;
        prizePool = 0;

        emit PrizeAwarded(prizeAmount, winnerAddress);

        _sendOrAllocateUserShare(payable(winnerAddress), prizeAmount);
    }

    function claimAbandonedGameShare() external nonReentrant {
        if (totalPaymentsPerUser[msg.sender] == 0) revert NoFeePaymentMade();
        if (claimedAbandonedGameUserShares[msg.sender] == true)
            revert AbandonedGameUserShareAlreadyClaimed();
        if (prizePool == 0) revert EmptyPrizePool();
        if (!abandonedGameTimeElapsed()) revert AbandonedGameTimeNotElapsed();

        if (!gameEnded) {
            gameEnded = true;
            emit GameEnded();
            emit GameAbandoned();

            abandonedGameLastPlayerShare = _calculateAbandonedGameLastPlayerShare();
            if (abandonedGameLastPlayerShare > prizePool) revert("Invalid share calculation");
            abandonedGameRemainingPrize = prizePool - abandonedGameLastPlayerShare;
        }

        bool isLastPlayer = msg.sender == lastPlayerAddress;
        uint256 shareAmount;
        if (isLastPlayer) {
            shareAmount = abandonedGameLastPlayerShare;
        } else {
            shareAmount = (abandonedGameRemainingPrize * totalPaymentsPerUser[msg.sender]) / totalPayments;
        }

        emit AbandonedGameUserShareClaimed(msg.sender, shareAmount, isLastPlayer);

        claimedAbandonedGameUserShares[msg.sender] = true;
        _sendOrAllocateUserShare(payable(msg.sender), shareAmount);
    }

    function claimUserShare() external nonReentrant {
        uint256 unclaimedAmount = unclaimedShares[msg.sender];
        if (unclaimedAmount == 0) revert NoUnclaimedShares();

        unclaimedShares[msg.sender] = 0;

        bool success = _sendUserShare(payable(msg.sender), unclaimedAmount);
        if (!success) {
            unclaimedShares[msg.sender] = unclaimedAmount;
        }
    }

    function withdrawTeamShare() external nonReentrant {
        if (msg.sender != teamAddress) revert NotTeamAddress();
        if (teamShare == 0) revert NoTeamShareToWithdraw();

        uint256 teamAmount = teamShare;
        teamShare = 0;

        (bool success, ) = payable(msg.sender).call{value: teamAmount}("");
        if (!success) {
            teamShare = teamAmount;
            revert TeamShareWithdrawFailed();
        }

        emit TeamShareWithdrawn(teamAmount);
    }

    function abandonedGameTimeElapsed() public view returns (bool) {
        return block.timestamp >= lastPaymentTime + 3 days;
    }

    function transferOwnerFundsToContract() external payable nonReentrant {
        if (msg.sender != owner) revert NotOwner();

        teamShare += msg.value;
        
        emit OwnerFundsTransferred(msg.value);
        emit TeamShareIncreased(teamShare);
    }

    function fundPrizePool() external payable nonReentrant {
        if (gameEnded) revert GameHasEnded();
        if (msg.value == 0) revert("Amount must be greater than 0");

        prizePool += msg.value;
        lastPaymentTime = block.timestamp;
        
        emit PrizePoolFunded(msg.value);
        emit PrizePoolIncreased(prizePool);
    }

    function _sendUserShare(
        address payable recipient,
        uint256 amount
    ) private returns (bool) {
        (bool success, ) = recipient.call{value: amount}("");
        if (success) {
            emit UserShareSent(recipient, amount);
        }

        return success;
    }

    function _sendOrAllocateUserShare(
        address payable recipient,
        uint256 amount
    ) private {
        bool success = _sendUserShare(recipient, amount);
        if (!success) {
            unclaimedShares[recipient] = amount;
            emit UnclaimedUserShareAdded(recipient, amount);
        }
    }

    function _calculateAbandonedGameLastPlayerShare() private view returns (uint256) {
        uint256 tenPercent = (prizePool * 10) / 100;
        uint256 proportionalShare = (prizePool * totalPaymentsPerUser[lastPlayerAddress]) / totalPayments;

        return tenPercent > proportionalShare ? tenPercent : proportionalShare;
    }
}
