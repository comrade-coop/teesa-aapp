// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Game is ReentrancyGuard {
    address public immutable owner;
    uint256 public immutable deploymentTime;
    bool public gameEnded;

    address[] public immutable teamAddresses;
    mapping(address => uint256) public teamBalances;

    uint256 public prizePool;
    uint256 public currentPrice;

    mapping(address => uint256) public userTotalPayments;
    address[] private uniqueUsers;
    mapping(address => bool) private isUser;
    address public lastPlayer;
    uint256 public totalPayments;
    uint256 public lastPaymentTime;

    mapping(address => uint256) public unclaimedShares;

    error InsufficientPayment();
    error GameHasEnded();
    error EmptyPrizePool();
    error NotOwner();
    error NoBalanceToWithdraw();
    error TransferFailed();
    error TimeNotElapsed();
    error NoUnclaimedShare();
    error InvalidTeamAddresses();

    event Payment(
        address indexed user,
        uint256 amount,
        uint256 timestamp,
        uint256 newTotal
    );
    event PaymentReceived(address indexed payer, uint256 amount);
    event PrizePoolIncreased(uint256 newTotal);
    event TeamPaymentSent(address indexed teamMember, uint256 amount);
    event PrizeAwarded(address indexed winner, uint256 amount);
    event UnclaimedPrizeShareAdded(address indexed user, uint256 amount);
    event UnclaimedPrizeShareClaimed(address indexed user, uint256 amount);
    event PrizePoolDistributedAfterTimeExpired(address indexed user, uint256 amount);

    constructor(address[] memory _teamAddresses) {
        if (_teamAddresses.length == 0) revert InvalidTeamAddresses();

        teamAddresses = _teamAddresses;
        currentPrice = 0.001 ether;
        owner = msg.sender;
        deploymentTime = block.timestamp;
        lastPaymentTime = block.timestamp;
    }

    function getCurrentPrice() external view returns (uint256) {
        return currentPrice;
    }

    function pay() external payable nonReentrant {
        if (gameEnded) revert GameHasEnded();
        if (msg.value < currentPrice) revert InsufficientPayment();

        lastPlayer = msg.sender;
        lastPaymentTime = block.timestamp;

        unchecked {
            userTotalPayments[msg.sender] += msg.value;
            totalPayments += msg.value;
        }

        emit Payment(
            msg.sender,
            msg.value,
            block.timestamp,
            userTotalPayments[msg.sender]
        );

        if (!isUser[msg.sender]) {
            isUser[msg.sender] = true;
            uniqueUsers.push(msg.sender);
        }

        uint256 teamShare = (msg.value * 30) / 100;
        uint256 prizePoolShare = msg.value - teamShare;

        uint256 sharePerTeamMember = teamShare / teamAddresses.length;
        uint256 length = teamAddresses.length;
        for (uint256 i = 0; i < length;) {
            unchecked {
                teamBalances[teamAddresses[i]] += sharePerTeamMember;
                ++i;
            }
        }

        unchecked {
            prizePool += prizePoolShare;
        }
        emit PrizePoolIncreased(prizePool);

        uint256 newPrice = (currentPrice * 10078) / 10000;
        uint256 maxPrice = 1 ether;
        currentPrice = newPrice > maxPrice ? maxPrice : newPrice;
        emit PaymentReceived(msg.sender, msg.value);
    }

    function getPrizePool() external view returns (uint256) {
        return prizePool;
    }

    function awardPrize(address payable winner) external nonReentrant {
        if (msg.sender != owner) revert NotOwner();
        if (prizePool == 0) revert EmptyPrizePool();
        if (gameEnded) revert GameHasEnded();

        gameEnded = true;

        uint256 prizeAmount = prizePool;
        prizePool = 0;

        (bool success, ) = winner.call{value: prizeAmount}("");
        if (!success) revert TransferFailed();
        emit PrizeAwarded(winner, prizeAmount);
    }

    function withdrawTeamShare() external nonReentrant {
        uint256 amount = teamBalances[msg.sender];
        if (amount == 0) revert NoBalanceToWithdraw();

        teamBalances[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            teamBalances[msg.sender] = amount;
            revert TransferFailed();
        }

        emit TeamPaymentSent(msg.sender, amount);
    }

    function getUserTotalPayments(address user) external view returns (uint256) {
        return userTotalPayments[user];
    }

    function distributeIfTimeExpired() external nonReentrant {
        if (gameEnded) revert GameHasEnded();
        if (block.timestamp < lastPaymentTime + 30 days) revert TimeNotElapsed();
        if (prizePool == 0) revert EmptyPrizePool();

        gameEnded = true;

        uint256 _prizePool = prizePool;
        prizePool = 0;

        uint256 lastPlayerShare = (_prizePool * 10) / 100;
        uint256 remainingPrize = _prizePool - lastPlayerShare;

        if (lastPlayer != address(0)) {
            if (_sendPrize(payable(lastPlayer), lastPlayerShare)) {
                emit PrizePoolDistributedAfterTimeExpired(lastPlayer, lastPlayerShare);
            }
        }

        uint256 length = uniqueUsers.length;
        for (uint256 i = 0; i < length;) {
            address user = uniqueUsers[i];
            uint256 userPayments = userTotalPayments[user];
            
            if (userPayments > 0) {
                uint256 share = (remainingPrize * userPayments) / totalPayments;
                if (share > 0 && _sendPrize(payable(user), share)) {
                    emit PrizePoolDistributedAfterTimeExpired(user, share);
                }
            }
            unchecked { ++i; }
        }
    }

    function claimFailedShare() external nonReentrant {
        uint256 amount = unclaimedShares[msg.sender];
        if (amount == 0) revert NoUnclaimedShare();

        unclaimedShares[msg.sender] = 0;

        if (!_sendPrize(payable(msg.sender), amount)) revert TransferFailed();

        emit UnclaimedPrizeShareClaimed(msg.sender, amount);
    }

    function _sendPrize(address payable recipient, uint256 amount) private returns (bool) {
        (bool success, ) = recipient.call{value: amount}("");
        if (!success) {
            unclaimedShares[recipient] = amount;
            emit UnclaimedPrizeShareAdded(recipient, amount);
        }

        return success;
    }
}
