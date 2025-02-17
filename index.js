let count = 0;
const command = setInterval(() => {
  console.log(`Hello, world! Iteration ${count++}.`);
  if (count === 3) {
    clearInterval(command);
  }
}, 2000);
