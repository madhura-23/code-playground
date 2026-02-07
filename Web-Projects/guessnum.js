const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter the maximum number: ", (max) => {
  const randomNum = Math.floor(Math.random() * Number(max)) + 1;

  const askGuess = () => {
    rl.question("Guess a number (or type 'quit' to exit): ", (guess) => {
      if (guess.toLowerCase() === "quit") {
        console.log("Quitting the game");
        rl.close();
      } else if (Number(guess) === randomNum) {
        console.log("🎉 Congratulations! You guessed the correct number!");
        rl.close();
      } else {
        console.log("❌ Wrong guess, try again!");
        askGuess();
      }
    });
  };

  askGuess();
});
