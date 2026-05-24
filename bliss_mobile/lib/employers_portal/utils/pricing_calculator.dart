class PricingCalculator {
  final double ticketFee; // flight + logistics
  final double serviceFee; // your profit
  final double hireFee; // amount employer pays

  PricingCalculator({
    required this.ticketFee,
    required this.serviceFee,
    required this.hireFee,
  });

  /// Calculate total cost for employer
  double totalEmployerCost() {
    return ticketFee + hireFee;
  }

  /// Calculate total revenue for the system
  double totalRevenue() {
    return serviceFee + hireFee;
  }

  /// Suggested hire fee based on ticket and service
  double suggestedHireFee() {
    return ticketFee * 0.3 + serviceFee; // Example: 30% of ticket + profit
  }

  /// Standalone utility to calculate hire fee
  static double calculateHireFee(double baseSalary, double ticketFee, double profitPercent) {
    return baseSalary + ticketFee + (baseSalary * profitPercent / 100);
  }
}
