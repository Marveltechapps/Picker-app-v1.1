/**
 * User service – from backend-workflow.yaml (user_profile_upsert, location_type_set, upi_upsert).
 */
const mongoose = require('mongoose');
const User = require('../models/user.model');

const updateProfile = async (userId, body) => {
  const set = {};
  if (body.name != null) set.name = body.name;
  if (body.age != null) set.age = body.age;
  if (body.gender != null) set.gender = body.gender;
  if (body.photoUri != null) set.photoUri = body.photoUri;
  if (body.email != null) set.email = body.email;
  if (body.phone != null) set.phone = body.phone;
  const user = await User.findByIdAndUpdate(userId, { $set: set }, { new: true }).lean();
  return user || null;
};

const setLocationType = async (userId, locationType) => {
  if (!['warehouse', 'darkstore'].includes(locationType)) return null;
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { locationType } },
    { new: true }
  ).lean();
  return user || null;
};

const setSelectedShifts = async (userId, selectedShifts) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { selectedShifts: selectedShifts || [] } },
    { new: true }
  ).lean();
  return user || null;
};

const setUpi = async (userId, upiId, upiName) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { upiId, upiName } },
    { new: true }
  ).lean();
  return user || null;
};

const getById = async (userId) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return null;
  return User.findById(userId).lean();
};

/** GET profile: return current user profile for app display (name, photo, member since, etc.) */
const getProfile = async (userId) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return null;
  const user = await User.findById(userId).lean();
  if (!user) return null;
  return {
    id: user._id.toString(),
    name: user.name,
    phone: user.phone,
    email: user.email,
    age: user.age,
    gender: user.gender,
    photoUri: user.photoUri,
    createdAt: user.createdAt,
    selectedShifts: user.selectedShifts || [],
    locationType: user.locationType,
    trainingProgress: user.trainingProgress || {},
    upiId: user.upiId,
    upiName: user.upiName,
  };
};

module.exports = { updateProfile, setLocationType, setSelectedShifts, setUpi, getById, getProfile };
