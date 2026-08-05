"use server";

import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Otp from "@/models/Otp";
import bcrypt from "bcryptjs";
import { BRAND } from "@/lib/constants";
import { normalizeIndianPhone } from "@/lib/phone";

export async function ensureSeedAdmin() {
  await connectToDatabase();
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminEmail = "admin@gmail.com";

  const existing = await User.findOne({
    $or: [{ username: adminUsername }, { email: adminEmail }],
  });

  if (existing) {
    let dirty = false;
    if (!existing.email) {
      existing.email = adminEmail;
      dirty = true;
    }
    if (!existing.fullName) {
      existing.fullName = "Og Stays Owner";
      dirty = true;
    }
    if (!existing.flatName) {
      existing.flatName = BRAND.flatName;
      dirty = true;
    }
    if (!existing.flatNumber) {
      existing.flatNumber = BRAND.roomNumber;
      dirty = true;
    }
    if (dirty) await existing.save();
    return;
  }

  const count = await User.countDocuments();
  if (count === 0) {
    await User.create({
      username: adminUsername,
      email: adminEmail,
      fullName: "Og Stays Owner",
      phoneNumber: "+919876543210",
      flatName: BRAND.flatName,
      flatNumber: BRAND.roomNumber,
      passwordHash: await bcrypt.hash(adminPassword, 10),
    });
    console.log(`Seeded Mongo admin: ${adminEmail} / ${adminPassword}`);
  }
}

export async function findUserByLogin(login: string) {
  await connectToDatabase();
  await ensureSeedAdmin();
  const key = login.toLowerCase().trim();
  return User.findOne({ $or: [{ email: key }, { username: key }] });
}

export async function findUserByEmail(email: string) {
  await connectToDatabase();
  await ensureSeedAdmin();
  return User.findOne({ email: email.toLowerCase().trim() });
}

export async function createUser(input: {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  flatName?: string;
  flatNumber?: string;
}) {
  await connectToDatabase();
  await ensureSeedAdmin();

  const email = input.email.toLowerCase().trim();
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    return { error: "An account with this email already exists. Please sign in." };
  }

  const phone = normalizeIndianPhone(input.phoneNumber);
  if (!phone) {
    return { error: "Enter a valid Indian mobile (+91, 10 digits starting with 6–9)." };
  }

  let username =
    email.split("@")[0].replace(/[^a-z0-9._-]/gi, "").toLowerCase() || "owner";
  let i = 1;
  while (await User.findOne({ username })) {
    username = `${username.replace(/\d+$/, "")}${i++}`;
  }

  const user = await User.create({
    username,
    email,
    fullName: input.fullName.trim(),
    phoneNumber: phone,
    flatName: input.flatName || BRAND.flatName,
    flatNumber: input.flatNumber || BRAND.roomNumber,
    passwordHash: await bcrypt.hash(input.password, 10),
  });

  return {
    user: {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.fullName,
    },
  };
}

export async function createResetOtp(emailRaw: string) {
  await connectToDatabase();
  const email = emailRaw.toLowerCase().trim();
  const user = await findUserByEmail(email);
  if (!user) {
    return { error: "No account found with this email. Sign up first, or try admin@gmail.com." };
  }

  const code = String(Math.floor(1000 + Math.random() * 9000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await Otp.deleteMany({ email, purpose: "reset" });
  await Otp.create({ email, code, purpose: "reset", expiresAt, used: false });
  return { otp: code, email };
}

export async function verifyOtp(emailRaw: string, code: string) {
  await connectToDatabase();
  const email = emailRaw.toLowerCase().trim();
  const record = await Otp.findOne({
    email,
    purpose: "reset",
    used: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!record || record.code !== code.trim()) {
    return { error: "Invalid or expired OTP." };
  }
  return { ok: true };
}

export async function resetPassword(emailRaw: string, code: string, newPassword: string) {
  if (newPassword.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  await connectToDatabase();
  const email = emailRaw.toLowerCase().trim();
  const record = await Otp.findOne({
    email,
    purpose: "reset",
    used: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!record || record.code !== code.trim()) {
    return { error: "Invalid or expired OTP. Request a new code." };
  }

  const user = await findUserByEmail(email);
  if (!user) return { error: "Account not found." };

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  record.used = true;
  await record.save();
  return { ok: true };
}
