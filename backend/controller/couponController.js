import Coupon from "../models/Coupon.js";
import asyncHandler from "../utils/asyncHandler.js";

/* ================= GET COUPONS ================= */
export const getCoupons = asyncHandler(async (req, res) => {
  const now = new Date();

  const coupons = await Coupon.find({
    isActive: true,
    $or: [
      { validFrom: { $exists: false } },
      { validFrom: { $lte: now } }
    ],
    $or: [
      { validTill: { $exists: false } },
      { validTill: { $gte: now } }
    ]
  });

  res.json(coupons);
});

/* ================= APPLY COUPON ================= */
export const applyCoupon = asyncHandler(async (req, res) => {
  const { couponCode, subtotal } = req.body;

  if (!couponCode) {
    res.status(400);
    throw new Error("Coupon required");
  }

  const coupon = await Coupon.findOne({
    code: couponCode.toUpperCase(),
    isActive: true,
  });

  if (!coupon) {
    res.status(400);
    throw new Error("Invalid coupon");
  }

  const now = new Date();

  if (coupon.validFrom && now < coupon.validFrom) {
    res.status(400);
    throw new Error("Coupon not started yet");
  }

  if (coupon.validTill && now > coupon.validTill) {
    res.status(400);
    throw new Error("Coupon expired");
  }

  if (subtotal < coupon.minOrderAmount) {
    res.status(400);
    throw new Error(`Minimum order ₹${coupon.minOrderAmount}`);
  }

  // Check applicable users restriction
  if (
    coupon.applicableUsers.length > 0 &&
    !coupon.applicableUsers.includes(req.user._id)
  ) {
    res.status(403);
    throw new Error("Coupon not applicable for this user");
  }

  // Check usage limit
  const usage = coupon.usedBy.find(
    (u) => u.user.toString() === req.user._id.toString()
  );

  if (usage && usage.count >= coupon.usageLimitPerUser) {
    res.status(400);
    throw new Error("Coupon usage limit exceeded");
  }

  let discount = 0;

  if (coupon.discountType === "PERCENTAGE") {
    discount = (subtotal * coupon.discountValue) / 100;

    if (coupon.maxDiscount > 0) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else {
    discount = coupon.discountValue;
  }

  res.json({ discount });
});