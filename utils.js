/* Returns Random 5 Digit Code */
const makeid = (length) => {
   length -= 1
   let multiplier = 1
   for(let i = 0; i < length; i++) {
      multiplier *= 10
   }
   return Math.floor(Math.random()*(9 * multiplier)) + (1 * multiplier);
}

/* Returns # Of Bots Needed To Make A Game Of Base2 # Of Players */
const botsNeeded = (numOfPlayers) => {
   let sequence = 2
   let remainder = 0;

   if(sequence === numOfPlayers) {
      return 0
   }
   while(numOfPlayers > sequence) {
      sequence *= 2
      if(sequence > numOfPlayers) {
         remainder = sequence - numOfPlayers
         return remainder
      }
      if(sequence === numOfPlayers) {
         return 0
      }
   }
}

/* Number Of Rounds Needed Before Final Round Based on Initial Players */
const getNumberOfRoundsNeeded = (numPlayers) => {
   console.log('num play', numPlayers)
   let totalNumOfPlayers = botsNeeded(numPlayers) + numPlayers
   console.log('Total # of players', totalNumOfPlayers)
   let totalRoundsNeeded = 0;
   while(totalNumOfPlayers > 2) {
       totalRoundsNeeded++
       totalNumOfPlayers /= 2
   }
   console.log('Total # of rounds before final round', totalRoundsNeeded)
   return totalRoundsNeeded
}


// getNumberOfRoundsNeeded(24)

module.exports = {
   makeid,
   botsNeeded,
   getNumberOfRoundsNeeded
}