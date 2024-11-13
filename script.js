class Card {
    constructor(rank, suit) {
        this.rank = rank;
        this.suit = suit;
    }

    toString() {
        return `${this.rank}${this.suit}`;
    }
}

class Deck {
    constructor() {
        this.cards = [];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const suits = ['♠', '♥', '♦', '♣'];
        for (let suit of suits) {
            for (let rank of ranks) {
                this.cards.push(new Card(rank, suit));
            }
        }
        this.shuffle();
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw() {
        return this.cards.pop();
    }
}

class Player {
    constructor(id) {
        this.id = id;
        this.hand = [];
        this.pairs = [];
    }

    addCard(card) {
        this.hand.push(card);
        return this.checkForPairs();
    }

    removeCard(card) {
        const index = this.hand.findIndex(c => c.rank === card.rank && c.suit === card.suit);
        if (index !== -1) {
            return this.hand.splice(index, 1)[0];
        }
        return null;
    }

    hasCard(rank) {
        return this.hand.some(card => card.rank === rank);
    }

    checkForPairs() {
        const newPairs = [];
        const rankCounts = {};
        this.hand.forEach(card => {
            rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
        });

        for (const rank in rankCounts) {
            if (rankCounts[rank] >= 2) {
                const pairCards = this.hand.filter(card => card.rank === rank);
                while (pairCards.length >= 2) {
                    const pair = [pairCards.shift(), pairCards.shift()];
                    this.pairs.push(pair);
                    newPairs.push(pair);
                    this.hand = this.hand.filter(card => 
                        !pair.some(p => p.rank === card.rank && p.suit === card.suit)
                    );
                }
            }
        }
        return newPairs;
    }

    hasPairOfRank(rank) {
        return this.pairs.some(pair => pair[0].rank === rank);
    }
}

class GoFishGame {
    constructor() {
        this.deck = new Deck();
        this.players = [new Player(1), new Player(2), new Player(3), new Player(4)];
        this.currentPlayerIndex = 0;
        this.selectedCard = null;
        this.gameLog = document.getElementById('game-log');
        this.showOtherPlayersCards = false;
    }

    dealInitialCards() {
        for (let player of this.players) {
            this.drawToFive(player);
        }
    }

    addLogEntry(message) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = message;
        this.gameLog.appendChild(entry);
        this.gameLog.scrollTop = this.gameLog.scrollHeight;
    }

    drawToFive(player) {
        while (this.deck.cards.length > 0 && player.hand.length < 5) {
            const drawnCard = this.deck.draw();
            if (drawnCard) {
                if (player.id === 1 || this.showOtherPlayersCards) {
                    this.addLogEntry(`Player ${player.id} drew ${drawnCard.toString()}`);
                } else {
                    this.addLogEntry(`Player ${player.id} drew a card`);
                }
                
                const newPairs = player.addCard(drawnCard);
                if (newPairs.length > 0) {
                    newPairs.forEach(pair => {
                        this.addLogEntry(`Player ${player.id} made a pair of ${pair[0].rank}s`);
                    });
                }
            }
        }
    }

    playTurn(targetPlayerIndex) {
        if (this.currentPlayerIndex !== 0 || !this.selectedCard) {
            return;
        }

        if (targetPlayerIndex === 0) {
            return;
        }
        
        if (this.players[0].hasPairOfRank(this.selectedCard.rank)) {
            this.addLogEntry(`Cannot request ${this.selectedCard.rank} as you already have a pair of it`);
            return;
        }

        const currentPlayer = this.players[this.currentPlayerIndex];
        const targetPlayer = this.players[targetPlayerIndex];

        this.addLogEntry(`Player 1 asks Player ${targetPlayerIndex + 1} for a ${this.selectedCard.rank}`);

        if (targetPlayer.hasCard(this.selectedCard.rank)) {
            const matchingCards = targetPlayer.hand.filter(card => card.rank === this.selectedCard.rank);
            matchingCards.forEach(card => {
                targetPlayer.removeCard(card);
                currentPlayer.addCard(card);
            });
            
            this.addLogEntry(`Player 1 got ${matchingCards.length} ${this.selectedCard.rank}(s) from Player ${targetPlayerIndex + 1}`);
            
            const newPairs = currentPlayer.checkForPairs();
            if (newPairs.length > 0) {
                newPairs.forEach(pair => {
                    this.addLogEntry(`Player 1 made a pair of ${pair[0].rank}s`);
                });
            }
            
            this.drawToFive(currentPlayer);
            this.drawToFive(targetPlayer);
        } else {
            const drawnCard = this.deck.draw();
            if (drawnCard) {
                this.addLogEntry(`Player 1 went fishing and drew ${drawnCard.toString()}`);
                const newPairs = currentPlayer.addCard(drawnCard);
                if (newPairs.length > 0) {
                    newPairs.forEach(pair => {
                        this.addLogEntry(`Player 1 made a pair of ${pair[0].rank}s`);
                    });
                }
                this.drawToFive(currentPlayer);
            } else {
                this.addLogEntry(`No cards left in deck`);
            }
            this.nextTurn();
        }

        this.selectedCard = null;
        this.checkWinCondition();
        this.render();

        if (this.currentPlayerIndex !== 0) {
            setTimeout(() => this.playAITurn(), 1000);
        }
    }

    playAITurn() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        
        if (currentPlayer.hand.length === 0) {
            this.nextTurn();
            this.render();
            return;
        }

        const availableCards = currentPlayer.hand.filter(card => 
            !currentPlayer.hasPairOfRank(card.rank)
        );

        if (availableCards.length === 0) {
            const drawnCard = this.deck.draw();
            if (drawnCard) {
                if (this.showOtherPlayersCards) {
                    this.addLogEntry(`Player ${this.currentPlayerIndex + 1} drew ${drawnCard.toString()}`);
                } else {
                    this.addLogEntry(`Player ${this.currentPlayerIndex + 1} drew a card`);
                }
                const newPairs = currentPlayer.addCard(drawnCard);
                if (newPairs.length > 0) {
                    newPairs.forEach(pair => {
                        this.addLogEntry(`Player ${this.currentPlayerIndex + 1} made a pair of ${pair[0].rank}s`);
                    });
                }
                this.drawToFive(currentPlayer);
            }
            this.nextTurn();
        } else {
            const requestedCard = availableCards[Math.floor(Math.random() * availableCards.length)];
            let targetPlayerIndex;
            do {
                targetPlayerIndex = Math.floor(Math.random() * 4);
            } while (targetPlayerIndex === this.currentPlayerIndex);

            const targetPlayer = this.players[targetPlayerIndex];

            this.addLogEntry(`Player ${this.currentPlayerIndex + 1} asks Player ${targetPlayerIndex + 1} for a ${requestedCard.rank}`);

            if (targetPlayer.hasCard(requestedCard.rank)) {
                const matchingCards = targetPlayer.hand.filter(card => card.rank === requestedCard.rank);
                matchingCards.forEach(card => {
                    targetPlayer.removeCard(card);
                    currentPlayer.addCard(card);
                });
                
                this.addLogEntry(`Player ${this.currentPlayerIndex + 1} got ${matchingCards.length} ${requestedCard.rank}(s) from Player ${targetPlayerIndex + 1}`);
                
                const newPairs = currentPlayer.checkForPairs();
                if (newPairs.length > 0) {
                    newPairs.forEach(pair => {
                        this.addLogEntry(`Player ${this.currentPlayerIndex + 1} made a pair of ${pair[0].rank}s`);
                    });
                }
                
                this.drawToFive(currentPlayer);
                this.drawToFive(targetPlayer);
            } else {
                const drawnCard = this.deck.draw();
                if (drawnCard) {
                    this.addLogEntry(`Player ${this.currentPlayerIndex + 1} went fishing and drew ${drawnCard.toString()}`);
                    const newPairs = currentPlayer.addCard(drawnCard);
                    if (newPairs.length > 0) {
                        newPairs.forEach(pair => {
                            this.addLogEntry(`Player ${this.currentPlayerIndex + 1} made a pair of ${pair[0].rank}s`);
                        });
                    }
                    this.drawToFive(currentPlayer);
                } else {
                    this.addLogEntry(`No cards left in deck`);
                }
                this.nextTurn();
            }
        }

        this.checkWinCondition();
        this.render();

        if (this.currentPlayerIndex !== 0) {
            setTimeout(() => this.playAITurn(), 1000);
        }
    }

    nextTurn() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 4;
        document.getElementById('current-player').textContent = `Player ${this.currentPlayerIndex + 1}`;
    }

    checkWinCondition() {
        if (this.deck.cards.length === 0 && this.players.some(player => player.hand.length === 0)) {
            const playerScores = this.players.map(player => ({
                id: player.id,
                score: player.pairs.length
            }));
            
            const maxScore = Math.max(...playerScores.map(p => p.score));
            const winners = playerScores.filter(p => p.score === maxScore);
            
            if (winners.length === 1) {
                alert(`Player ${winners[0].id} wins with ${winners[0].score} pairs!`);
            } else {
                alert(`Tie game between Players ${winners.map(w => w.id).join(', ')}!`);
            }
            this.reset();
        }
    }

    reset() {
        this.deck = new Deck();
        this.players = [new Player(1), new Player(2), new Player(3), new Player(4)];
        this.currentPlayerIndex = 0;
        this.selectedCard = null;
        this.gameLog.innerHTML = '';
        this.addLogEntry('Game started');
        this.dealInitialCards();
        this.render();
    }

    render() {
        for (let i = 1; i <= 4; i++) {
            const playerElement = document.getElementById(`player${i}`);
            const pairsElement = document.getElementById(`player${i}-pairs`);
            
            playerElement.innerHTML = '';
            this.players[i - 1].hand.forEach(card => {
                const cardElement = document.createElement('div');
                cardElement.className = 'card';
                
                cardElement.textContent = (i === 1 || this.showOtherPlayersCards) ? card.toString() : '🂠';
                
                if (i === 1) {
                    cardElement.addEventListener('click', () => {
                        this.selectedCard = card;
                        this.render();
                    });
                    if (this.selectedCard && this.selectedCard.rank === card.rank && 
                        this.selectedCard.suit === card.suit) {
                        cardElement.classList.add('selected');
                    }
                } else if (this.currentPlayerIndex === 0 && this.selectedCard) {
                    cardElement.style.cursor = 'pointer';
                    cardElement.addEventListener('click', () => this.playTurn(i - 1));
                }
                
                playerElement.appendChild(cardElement);
            });

            pairsElement.innerHTML = '';
            this.players[i - 1].pairs.forEach(pair => {
                const pairElement = document.createElement('div');
                pairElement.className = 'pair';
                pairElement.textContent = `${pair[0].rank}`;
                pairsElement.appendChild(pairElement);
            });
        }

        document.getElementById('deck-count').textContent = this.deck.cards.length;
        document.getElementById('current-player').textContent = `Player ${this.currentPlayerIndex + 1}`;
    }

    toggleCardVisibility() {
        this.showOtherPlayersCards = !this.showOtherPlayersCards;
        this.render();
    }
}

const game = new GoFishGame();

document.getElementById('reset-game').addEventListener('click', () => game.reset());
document.getElementById('toggle-visibility').addEventListener('click', () => game.toggleCardVisibility());

game.dealInitialCards();
game.render(); 