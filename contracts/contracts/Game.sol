// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Game is ReentrancyGuard {
    address public immutable owner;
    uint256 public immutable deploymentTime;
    bool public gameEnded;

    address[] public teamAddresses;
    mapping(address => uint256) public teamBalances;

    uint256 public prizePool;
    uint256 public currentPrice;

    mapping(address => uint256) public userTotalPayments;
    address public lastPlayer;
    uint256 public totalPayments;
    uint256 public lastPaymentTime;

    mapping(address => uint256) public unclaimedShares;
    uint256 public perUnitPaymentShare;
    mapping(address => bool) public userPaymentsClaimed;

    error InsufficientPayment();
    error GameHasEnded();
    error EmptyPrizePool();
    error NotOwner();
    error NoBalanceToWithdraw();
    error TransferFailed();
    error TimeNotElapsed();
    error NoUnclaimedShare();
    error InvalidTeamAddresses();
    error AlreadyClaimed();
    error NoPaymentMade();
    error GameNotEnded();
    error NoPrizeToClaim();

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

        for(uint i = 0; i < _teamAddresses.length; i++) {
            teamAddresses.push(_teamAddresses[i]);
        }
        
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
            if (_sendPrizeShare(payable(lastPlayer), lastPlayerShare)) {
                emit PrizePoolDistributedAfterTimeExpired(lastPlayer, lastPlayerShare);
            }
        }

        if (totalPayments == 0) revert NoPaymentMade();

        perUnitPaymentShare = (remainingPrize * 1e18) / totalPayments;
    }

    function claimExpiredPrize() external nonReentrant {
        if (!gameEnded) revert GameNotEnded();
        if (userPaymentsClaimed[msg.sender]) revert AlreadyClaimed();

        uint256 userPayment = userTotalPayments[msg.sender];
        if (userPayment == 0) revert NoPaymentMade();

        userPaymentsClaimed[msg.sender] = true;

        uint256 share = (userPayment * perUnitPaymentShare) / 1e18;
        if (share == 0) revert NoPrizeToClaim();

        if (!_sendPrizeShare(payable(msg.sender), share)) {
            revert TransferFailed();
        }

        emit PrizePoolDistributedAfterTimeExpired(msg.sender, share);
    }

    function claimFailedShare() external nonReentrant {
        uint256 amount = unclaimedShares[msg.sender];
        if (amount == 0) revert NoUnclaimedShare();

        unclaimedShares[msg.sender] = 0;

        if (!_sendPrizeShare(payable(msg.sender), amount)) revert TransferFailed();

        emit UnclaimedPrizeShareClaimed(msg.sender, amount);
    }

    function _sendPrizeShare(address payable recipient, uint256 amount) private returns (bool) {
        (bool success, ) = recipient.call{value: amount}("");
        if (!success) {
            unclaimedShares[recipient] += amount;
            emit UnclaimedPrizeShareAdded(recipient, amount);
        }

        return success;
    }
}
