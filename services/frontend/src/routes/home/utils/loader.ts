//TanStack
import { createServerFn } from "@tanstack/react-start";

//types
import type { Profile, User, Questions, Answers, Tags, Badges } from '../../../types/profile';

export const getUserProfileInfo = createServerFn({ method: "GET" }).handler(
    async (): Promise<Profile> => {
        const backendUrl = process.env.BACKEND_URL ?? "http://localhost:5001";

        const userInfo = fetch(`${backendUrl}/user`, {
            signal: AbortSignal.timeout(10000),
        });
        const questionsInfo = fetch(`${backendUrl}/questions`, {
            signal: AbortSignal.timeout(10000),
        });
        const answersInfo = fetch(`${backendUrl}/answers`, {
            signal: AbortSignal.timeout(10000),
        });
        const tagsInfo = fetch(`${backendUrl}/tags`, {
            signal: AbortSignal.timeout(10000),
        });
        const badgesInfo = fetch(`${backendUrl}/badges`, {
            signal: AbortSignal.timeout(10000),
        });

        const [ userRes, qRes, aRes, tRes, bRes ] = (await Promise.all([userInfo, questionsInfo, answersInfo, tagsInfo, badgesInfo]))

        if (!userRes.ok) {
            const { error } = await userRes.json() as { error: string };
            throw new Error(error);
        }
        const user = await userRes.json() as User
        const questions = await qRes.json() as Questions[]
        const answers = await aRes.json() as Answers[]
        const tagsArr = await tRes.json() as Tags[]
        const badges = await bRes.json() as Badges[]

        return {
            user,
            questions,
            answers,
            tagsArr,
            badges
        };
    },
);

