"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import {
  createUser,
  createResetOtp,
  verifyOtp,
  resetPassword,
  ensureSeedAdmin,
} from "@/lib/auth-store";
import { normalizeIndianPhone, indianPhoneMessage } from "@/lib/phone";
import { z } from "zod";
import { BRAND } from "@/lib/constants";

const signupSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email"),
  phoneNumber: z.string().min(10),
  password: z.string().min(6, "Password must be at least 6 characters"),
  flatName: z.string().optional(),
  flatNumber: z.string().optional(),
});

export async function loginAction(formData: FormData) {
  try {
    await ensureSeedAdmin();
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!username || !password) {
      return { error: "Email/username and password are required." };
    }

    // redirect: false so we don't throw NEXT_REDIRECT into the client catch
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      return { error: "Invalid email/username or password." };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
        case "CallbackRouteError":
          return { error: "Invalid email/username or password." };
        default:
          return { error: "Something went wrong during login." };
      }
    }
    console.error("loginAction error:", error);
    return { error: "Something went wrong during login." };
  }
}

export async function signupAction(data: {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  flatName?: string;
  flatNumber?: string;
}) {
  try {
    const parsed = signupSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    if (!normalizeIndianPhone(parsed.data.phoneNumber)) {
      return { success: false, error: indianPhoneMessage };
    }

    const result = await createUser({
      ...parsed.data,
      flatName: parsed.data.flatName || BRAND.flatName,
      flatNumber: parsed.data.flatNumber || BRAND.roomNumber,
    });

    if (result.error || !result.user) {
      return { success: false, error: result.error || "Signup failed" };
    }

    return { success: true, username: result.user.username, email: result.user.email };
  } catch (e: any) {
    console.error("signupAction error:", e);
    return { success: false, error: e?.message || "Signup failed. Try again." };
  }
}

export async function sendResetOtpAction(emailRaw: string) {
  try {
    const email = emailRaw.toLowerCase().trim();
    if (!email.includes("@")) {
      return { success: false, error: "Enter a valid Gmail / email address." };
    }

    const result = await createResetOtp(email);
    if (result.error) {
      return { success: false, error: result.error };
    }

    console.log(`[OTP] Reset for ${email}: ${result.otp}`);
    return {
      success: true,
      message: `OTP ready for ${email}`,
      otp: result.otp,
    };
  } catch (e: any) {
    console.error("sendResetOtpAction error:", e);
    return { success: false, error: e?.message || "Could not send OTP." };
  }
}

export async function verifyResetOtpAction(emailRaw: string, code: string) {
  try {
    const result = await verifyOtp(emailRaw, code);
    if (result.error) return { success: false, error: result.error };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || "OTP verify failed." };
  }
}

export async function resetPasswordAction(
  emailRaw: string,
  code: string,
  newPassword: string
) {
  try {
    const result = await resetPassword(emailRaw, code, newPassword);
    if (result.error) return { success: false, error: result.error };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || "Password reset failed." };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
