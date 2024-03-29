import { mongoose } from "mongoose";
import UserStocks from "../models/UserStocks.js";
import Companies from "../models/Companies.js";
import Transactions from "../models/Transactions.js";
import User from "../models/User.js";
const ObjectId = mongoose.Types.ObjectId;

export const buyStock = async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    const { id: userId } = req.body.user;

    const company = await Companies.findOne({ symbol: symbol });
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const totalPrice = company.current_Price * quantity;
    const user = await User.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (totalPrice > user.current_Balance) {
      return res.status(400).json({ error: "Insufficient funds" });
    }

    user.current_Balance -= totalPrice;
    await user.save();

    const transaction = {
      user_Id: userId,
      company_Id: company._id,
      quantity: quantity,
      price: company.current_Price,
      transactionId: new ObjectId(),
      transactionType: "Buy",
      transactionTime: new Date(),
      transactionDate: new Date(),
    };

    const newTransaction = await Transactions.create(transaction);

    let userStock = await UserStocks.findOne({
      Company_Id: company._id,
    });

    if (!userStock) {
      userStock = new UserStocks({
        User_Id: userId,
        Company_Id: company._id,
        numberOfStocks: quantity,
      });
      await UserStocks.create(userStock);
    } else {
      userStock.numberOfStocks += quantity;
      await userStock.save();
    }

    res.status(200).json({
      message: "Stock purchased successfully",
      transaction: newTransaction,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sellStock = async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    const { id: userId } = req.body.user;

    const company = await Companies.findOne({ symbol: symbol });
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }
    const stocks = await UserStocks.findOne({
      User_Id: userId,
      Company_Id: company._id,
    });
    if (!stocks) {
      return res.status(404).json({ error: "No stocks in possession!" });
    }

    if (stocks.numberOfStocks < quantity) {
      return res
        .status(404)
        .json({ error: "Not enough stocks in possession!" });
    }

    const totalPrice = company.current_Price * quantity;
    const user = await User.findOne({ _id: new ObjectId(userId) });

    user.current_Balance += totalPrice;
    await user.save();

    const transaction = {
      user_Id: userId,
      company_Id: company._id,
      quantity: quantity,
      price: company.current_Price,
      transactionId: new ObjectId(),
      transactionType: "Sell",
      transactionTime: new Date(),
      transactionDate: new Date(),
    };

    const newTransaction = await Transactions.create(transaction);

    stocks.numberOfStocks -= quantity;
    if (stocks.numberOfStocks <= 0) {
      await UserStocks.findOneAndDelete({
        User_Id: userId,
        Company_Id: company._id,
      });
    } else {
      await stocks.save();
    }

    res.status(200).json({
      message: "Stock sold successfully",
      transaction: newTransaction,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
