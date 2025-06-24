import { Devvit } from '@devvit/public-api';
import { DateTime } from 'luxon';

const REDIS_COUNTDOWN_MATCHES_KEY = 'countdown:matches';
function makeKeyForCountdownUsers(eventId: string) {
    return `countdown:users:${eventId}`;
}

//how much time before in milliseconds
const REMINDER_WINDOW_MS = 12 * 60 * 60 * 1000;

export async function sendRemindersJob(context: Devvit.Context) {
    const now = Date.now();
    const eventIds = await context.redis.zRange(REDIS_COUNTDOWN_MATCHES_KEY, 0, -1);
    for (const eventId of eventIds) {
        const startTime = await context.redis.zScore(REDIS_COUNTDOWN_MATCHES_KEY, eventId);
        if (!startTime) continue;
        const startTimeNum = Number(startTime);
        if (startTimeNum - now <= REMINDER_WINDOW_MS && startTimeNum - now > 0) {
            const users = await context.redis.zRange(makeKeyForCountdownUsers(eventId), 0, -1);
            for (const userName of users) {
                try {
                    await context.reddit.sendPrivateMessage({
                        to: userName,
                        subject: 'Game Reminder',
                        text: `The match you subscribed to is about to start!`,
                    });
                } catch (err) {
                    console.error(`Failed to send reminder to ${userName}:`, err);
                }
            }
            await context.redis.del(makeKeyForCountdownUsers(eventId));
            await context.redis.zRem(REDIS_COUNTDOWN_MATCHES_KEY, eventId);
        }
        if (startTimeNum < now) {
            await context.redis.del(makeKeyForCountdownUsers(eventId));
            await context.redis.zRem(REDIS_COUNTDOWN_MATCHES_KEY, eventId);
        }
    }
}
