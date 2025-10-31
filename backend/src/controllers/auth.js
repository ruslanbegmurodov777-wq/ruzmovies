import { Op } from "sequelize";
import { User, Subscription, Video } from "../sequelize.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import asyncHandler from "../middlewares/asyncHandler.js";

export const signup = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  await user.save();

  const payload = { id: user.id };
  const envExpire = process.env.JWT_EXPIRE;
  const expiresIn = /^[0-9]+$/.test(envExpire)
    ? Number(envExpire)
    : (envExpire && typeof envExpire === 'string' ? envExpire : '7d');
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

  res.status(200).json({ success: true, data: token });
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user by email OR username
  const user = await User.findOne({ 
    where: { 
      [Op.or]: [
        { email: email },
        { username: email } // 'email' field can contain username too
      ]
    } 
  });

  if (!user) {
    return next({
      message: "The email or username is not registered",
      statusCode: 400,
    });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return next({ message: "The password does not match", statusCode: 400 });
  }

  const payload = { id: user.id };
  const envExpire = process.env.JWT_EXPIRE;
  const expiresIn = /^[0-9]+$/.test(envExpire)
    ? Number(envExpire)
    : (envExpire && typeof envExpire === 'string' ? envExpire : '7d');
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

  res.status(200).json({ success: true, data: token });
});

export const me = async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: [
      "id",
      "firstname",
      "lastname",
      "username",
      "email",
      "avatar",
      "cover",
      "channelDescription",
      "isAdmin",
      "isOwner",
    ],
  });

  const subscriptions = await Subscription.findAll({
    where: { subscriber: req.user.id },
  });

  const userIds = subscriptions.map((sub) => sub.subscribeTo);

  const channels = await User.findAll({
    attributes: ["id", "avatar", "username"],
    where: {
      id: {
        [Op.in]: userIds,
      },
    },
  });

  user.setDataValue("channels", channels);

  res.status(200).json({ success: true, data: user });
};