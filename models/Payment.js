// backend/models/payment.js

module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define(
    "Payment",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      intentId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },

      userId: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },

      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      method: {
        type: DataTypes.STRING, // mpesa / flutterwave / card
        allowNull: true,
      },

      status: {
        type: DataTypes.STRING, // pending / verified / failed
        defaultValue: "pending",
      },

      transactionId: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      metadata: {
        type: DataTypes.JSON, // optional extra info (callback data etc.)
        allowNull: true,
      },
    },
    {
      tableName: "payments",
      timestamps: true, // adds createdAt & updatedAt
    }
  );

  return Payment;
};