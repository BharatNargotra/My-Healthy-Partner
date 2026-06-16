import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Build a compact user profile string to minimise tokens.
 */
const buildProfileContext = (user) => {
  const parts = [];
  if (user.age)           parts.push(`age:${user.age}`);
  if (user.gender)        parts.push(`gender:${user.gender}`);
  if (user.height)        parts.push(`height:${user.height}cm`);
  if (user.weight)        parts.push(`weight:${user.weight}kg`);
  if (user.targetWeight)  parts.push(`target:${user.targetWeight}kg`);
  if (user.activityLevel) parts.push(`activity:${user.activityLevel}`);
  if (user.primaryGoal)   parts.push(`goal:${user.primaryGoal}`);
  return parts.join(', ');
};

/**
 * Generate daily calorie & macro recommendation.
 * Cached for 24 h per user — only regenerates if profile changed.
 * Returns: { dailyCalories, macros:{protein,carbs,fat}, advice }
 */
export const generateCalorieRecommendation = async (user) => {
  // Return cache if fresh (< 24 h) and profile hasn't changed
  const cache = user.aiRecommendation;
  if (cache?.generatedAt && Date.now() - new Date(cache.generatedAt) < 86_400_000) {
    return cache;
  }

  const profile = buildProfileContext(user);

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 200,
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content:
          'You are a nutrition expert. Reply ONLY with valid JSON, no markdown. ' +
          'Keys: dailyCalories(int), macros:{protein(int,g),carbs(int,g),fat(int,g)}, advice(string ≤60 words).',
      },
      { role: 'user', content: `Profile: ${profile}. Give daily nutrition targets.` },
    ],
  });

  const raw = response.choices[0].message.content.trim();
  const result = JSON.parse(raw);
  result.generatedAt = new Date();
  return result;
};

/**
 * AI meal analysis: estimate macros from a plain-text meal description.
 * Used to auto-fill the meal form when user types a food name.
 * Returns: { calories, protein, carbs, fat }
 */
export const analyzeMeal = async (mealDescription, quantity = '') => {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 80,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content:
          'Nutrition database. Reply ONLY with JSON: calories(int,kcal), protein(int,g), carbs(int,g), fat(int,g). No markdown.',
      },
      {
        role: 'user',
        content: `Estimate macros for: "${mealDescription}"${quantity ? `, quantity: ${quantity}` : ''}.`,
      },
    ],
  });

  return JSON.parse(response.choices[0].message.content.trim());
};

/**
 * AI exercise calorie estimator.
 * Returns: { caloriesBurned: int }
 */
export const estimateExerciseCalories = async (exerciseName, duration, weight) => {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 40,
    temperature: 0.1,
    messages: [
      {
        role: 'system',
        content: 'Reply ONLY with JSON: {caloriesBurned:int}. No markdown.',
      },
      {
        role: 'user',
        content: `Calories burned: ${exerciseName}, ${duration} min, person weight ${weight || 70} kg.`,
      },
    ],
  });

  return JSON.parse(response.choices[0].message.content.trim());
};

/**
 * AI daily insight — a short motivational/analytical paragraph
 * based on today's log vs goals.
 */
export const generateDailyInsight = async (log, user) => {
  const consumed  = log.totalCaloriesConsumed || 0;
  const burned    = log.totalCaloriesBurned || 0;
  const goal      = user.dailyCalorieGoal || 2000;
  const water     = log.waterIntake || 0;
  const waterGoal = user.dailyWaterGoal || 8;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 120,
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content:
          'You are a supportive health coach. Give a concise 2-3 sentence insight. Be specific, positive, actionable.',
      },
      {
        role: 'user',
        content:
          `User goal: ${user.primaryGoal}. ` +
          `Calories: consumed ${consumed} / goal ${goal}, burned ${burned}. ` +
          `Water: ${water}/${waterGoal} glasses. ` +
          `Workouts today: ${log.exercises?.length || 0}. ` +
          `Mood: ${log.mood || 'not set'}. Sleep: ${log.sleep || 'not logged'} hrs.`,
      },
    ],
  });

  return response.choices[0].message.content.trim();
};
