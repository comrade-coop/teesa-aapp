// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Game is ReentrancyGuard {
    address public owner;
    uint256 public deploymentTime;
    bool public gameEnded;

    address[] public teamAddresses;
    mapping(address => uint256) public teamBalances;

    uint256 public prizePool;
    uint256 public currentPrice;

    struct Payment {
        uint256 amount;
        uint256 timestamp;
    }

    mapping(address => Payment[]) public paymentHistory;
    address[] private uniqueUsers;
    mapping(address => bool) private isUser;
    address public lastPlayer;

    mapping(address => uint256) public unclaimedShares;

    event PaymentReceived(address indexed payer, uint256 amount);
    event PrizePoolIncreased(uint256 newTotal);
    event TeamPaymentSent(address indexed teamMember, uint256 amount);
    event PrizeAwarded(address indexed winner, uint256 amount);
    event UnclaimedPrizeShareAdded(address indexed user, uint256 amount);
    event UnclaimedPrizeShareClaimed(address indexed user, uint256 amount);
    event PrizePoolDistributedAfterTimeExpired(address indexed user, uint256 amount);

    constructor(address[] memory _teamAddresses) {
        require(_teamAddresses.length > 0, "Must provide at least one team address");

        teamAddresses = _teamAddresses;
        currentPrice = 10 ether;
        owner = msg.sender;
        deploymentTime = block.timestamp;
    }

    function getCurrentPrice() public view returns (uint256) {
        return currentPrice;
    }

    function pay() public payable nonReentrant {
        require(!gameEnded, "Game has ended");
        require(msg.value >= currentPrice, "Insufficient payment amount");

        lastPlayer = msg.sender;

        // Record the payment
        paymentHistory[msg.sender].push(
            Payment({amount: msg.value, timestamp: block.timestamp})
        );

        // Track unique players
        if (!isUser[msg.sender]) {
            isUser[msg.sender] = true;
            uniqueUsers.push(msg.sender);
        }

        // Calculate team and prize pool splits
        uint256 teamShare = (msg.value * 30) / 100;
        uint256 prizePoolShare = msg.value - teamShare;

        // Distribute team share
        uint256 sharePerTeamMember = teamShare / teamAddresses.length;
        for (uint256 i = 0; i < teamAddresses.length; i++) {
            teamBalances[teamAddresses[i]] += sharePerTeamMember;
        }

        // Add to prize pool
        prizePool += prizePoolShare;
        emit PrizePoolIncreased(prizePool);

        uint256 newPrice = (currentPrice * 10078) / 10000;
        uint256 maxPrice = 4500 ether;
        currentPrice = newPrice > maxPrice ? maxPrice : newPrice;
        emit PaymentReceived(msg.sender, msg.value);
    }

    function getPrizePool() public view returns (uint256) {
        return prizePool;
    }

    function awardPrize(address payable winner) public nonReentrant {
        require(msg.sender == owner, "Only owner can award prize");
        require(prizePool > 0, "Prize pool is empty");
        require(!gameEnded, "Game has already ended");

        gameEnded = true;

        uint256 prizeAmount = prizePool;
        prizePool = 0;

        (bool success, ) = winner.call{value: prizeAmount}("");
        require(success, "Prize transfer failed");
        emit PrizeAwarded(winner, prizeAmount);
    }

    function withdrawTeamShare() public nonReentrant {
        uint256 amount = teamBalances[msg.sender];
        require(amount > 0, "No balance to withdraw");

        teamBalances[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            teamBalances[msg.sender] = amount;
        }
        require(success, "Transfer failed");

        emit TeamPaymentSent(msg.sender, amount);
    }

    function getPaymentHistory(address payer) public view returns (Payment[] memory) {
        return paymentHistory[payer];
    }

    function distributeIfTimeExpired() public nonReentrant {
        require(!gameEnded, "Game has already ended");
        require(block.timestamp >= deploymentTime + 30 days, "One month period not elapsed");
        require(prizePool > 0, "Prize pool is empty");

        gameEnded = true;

        // Calculate shares
        uint256 lastPlayerShare = (prizePool * 10) / 100;
        uint256 remainingPrize = prizePool - lastPlayerShare;

        // Get total payments from all users
        uint256 totalPayments = 0;
        address[] memory users = uniqueUsers;
        uint256[] memory userTotalPayments = new uint256[](users.length);

        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            Payment[] memory payments = paymentHistory[user];
            uint256 userTotal = 0;

            for (uint256 k = 0; k < payments.length; k++) {
                userTotal += payments[k].amount;
            }

            userTotalPayments[i] = userTotal;
            totalPayments += userTotal;
        }

        // Distribute to the last player
        if (lastPlayer != address(0)) {
            bool success = _sendPrize(payable(lastPlayer), lastPlayerShare);
            if(success) {
                emit PrizePoolDistributedAfterTimeExpired(lastPlayer, lastPlayerShare);
            }
        }

        // Distribute proportionally to all users
        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            uint256 share = (remainingPrize * userTotalPayments[i]) / totalPayments;

            if (share > 0) {
                bool success = _sendPrize(payable(user), share);
                if(success) {
                    emit PrizePoolDistributedAfterTimeExpired(user, share);
                }
            }
        }

        prizePool = 0;
    }

    function claimFailedShare() external nonReentrant {
        uint256 amount = unclaimedShares[msg.sender];
        require(amount > 0, "No unclaimed share to claim");

        // Zero out the user's unclaimed share before sending
        unclaimedShares[msg.sender] = 0;

        // Attempt the transfer again
        bool success = _sendPrize(payable(msg.sender), amount);
        require(success, "Claim transfer failed");

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
