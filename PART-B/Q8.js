let nums = [10, 3, 7, 20, 13, 2];

let squares = nums.map((n) => n * n);
console.log("Squares:", squares);

const isPrime = (n) => {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) {
      return false;
    }
  }
  return true;
};

let PrimeNumbers = nums.filter(isPrime);
console.log("PrimeNumbers", PrimeNumbers);

let sum = nums.reduce((acc, curr) => acc + curr, 0);
console.log("sum:", sum);

let descending = [...nums].sort((a, b) => b - a);
console.log("Descending Order:", descending);
