const mongoose = require('mongoose')

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error', err))

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 100,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 200,
    },
    name: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 100,
      trim: true,
    },
    balance: {
      type: Number,
      default: 0, // 💰 Default balance for new users
      min: 0,
    },
    cashbackBalance: {
      type: Number,
      default: 0, // 🎁 Cashback wallet separate from spendable balance
      min: 0,
    },
  },
  { timestamps: true }
)

const transactionSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  note: { type: String },
  status: { type: String, enum: ["PENDING", "SUCCESS", "FAILED"], default: "PENDING" },
  timestamp: { type: Date, default: Date.now },
  cashbackAmount: { type: Number, default: 0 },
  cashbackRule: { type: String }, // optional: which rule applied
});

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  members: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
      email: { type: String, required: true },
      name: { type: String }
    }
  ],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
}, { timestamps: true });

const splitItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  email: { type: String, required: true },
  owedAmount: { type: Number, required: true, default: 0 }, // how much this user owes
  paidAmount: { type: Number, required: true, default: 0 }, // how much this user paid toward the bill
});

const billSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  title: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  payerId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true }, // who paid the bill
  splits: [splitItemSchema],
  status: { type: String, enum: ['OPEN', 'SETTLED', 'CANCELLED'], default: 'OPEN' },
}, { timestamps: true });

const reminderSchema = new mongoose.Schema({
  userEmail: String,
  message: String,
  dueDate: Date,
  relatedBillId: { type: mongoose.Schema.Types.ObjectId, ref: "bill" },
  status: { type: String, enum: ["PENDING", "SENT", "COMPLETED"], default: "PENDING" },
  aiSuggested: Boolean,
  createdAt: Date
});

const linkSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    balance: { type: Number, default: 0 },
    tapLinkId: { type: String, unique: true, sparse: true },
    financeScore: { type: Number, default: 700 }, // out of 900 like a CIBIL score
    qrCodeId: { type: String, unique: true, sparse: true }, // used for payment link
  },
  { timestamps: true }
);

userSchema.pre("save", function (next) {
  if (!this.tapLinkId) this.tapLinkId = `@${this.email.split("@")[0]}.goldpay`;
  if (!this.qrCodeId) this.qrCodeId = this._id.toString().slice(-6); // short unique code
  next();
});

const user = mongoose.model('user', userSchema, 'user')
const Link = mongoose.model('Link', linkSchema, 'Link')
const Group = mongoose.model('Group', groupSchema, 'Group')
const transaction = mongoose.model('transaction', transactionSchema, 'transaction')
const Bill = mongoose.model('Bill', billSchema, 'Bill')
const reminder = mongoose.model('reminder', reminderSchema, 'reminder')
module.exports = { user, transaction, Group, Bill, reminder, Link }
