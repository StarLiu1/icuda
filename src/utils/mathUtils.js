/**
 * Utility functions for mathematical operations
 */

/**
 * Solves a linear equation of the form ax + b = 0
 * @param {number} a - coefficient of x
 * @param {number} b - constant term
 * @returns {number} - the solution for x, or NaN if no unique solution exists
 */
export const solveLinearEquation = (a, b) => {
    if (a === 0) return NaN; // No unique solution
    return -b / a;
  };
  
  /**
   * Finds the intersection point of two lines
   * @param {number} m1 - slope of first line
   * @param {number} b1 - y-intercept of first line
   * @param {number} m2 - slope of second line
   * @param {number} b2 - y-intercept of second line
   * @returns {Object} - the x and y coordinates of the intersection point, or null if lines are parallel
   */
  export const findIntersection = (m1, b1, m2, b2) => {
    // Check if lines are parallel
    if (m1 === m2) return null;
    
    // Calculate intersection point
    const x = (b2 - b1) / (m1 - m2);
    const y = m1 * x + b1;
    
    return { x, y };
  };
  
  /**
   * Calculate standard normal probability density function
   * @param {number} x - input value
   * @param {number} mean - mean of the distribution
   * @param {number} stdDev - standard deviation of the distribution
   * @returns {number} - probability density at x
   */
  export const normalPdf = (x, mean, stdDev) => {
    const variance = stdDev * stdDev;
    const denominator = Math.sqrt(2 * Math.PI * variance);
    const numerator = Math.exp(-Math.pow(x - mean, 2) / (2 * variance));
    return numerator / denominator;
  };
  
  /**
   * Calculate cumulative distribution function for standard normal
   * @param {number} x - input value
   * @returns {number} - probability that a standard normal random variable is <= x
   */
  export const standardNormalCdf = (x) => {
    // Error function approximation for standard normal CDF
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - probability : probability;
  };
  
  /**
   * Calculate cumulative distribution function for normal distribution
   * @param {number} x - input value
   * @param {number} mean - mean of the distribution
   * @param {number} stdDev - standard deviation of the distribution
   * @returns {number} - probability that a normal random variable with given mean and stdDev is <= x
   */
  export const normalCdf = (x, mean, stdDev) => {
    return standardNormalCdf((x - mean) / stdDev);
  };
  
  /**
   * Generate a random number from standard normal distribution using Box-Muller transform
   * @returns {number} - random sample from standard normal distribution
   */
  export const randomNormal = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };
  
  /**
   * Generate a random number from normal distribution with given mean and stdDev
   * @param {number} mean - mean of the distribution
   * @param {number} stdDev - standard deviation of the distribution
   * @returns {number} - random sample from normal distribution
   */
  export const randomNormalWithParams = (mean, stdDev) => {
    return mean + stdDev * randomNormal();
  };