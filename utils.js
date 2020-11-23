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

module.exports = {
   makeid,
   botsNeeded,
}