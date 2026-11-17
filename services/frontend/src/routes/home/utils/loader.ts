//TanStack
import { createServerFn } from "@tanstack/react-start";

//types
import type { Profile, User, Questions, Answers, Tags, Badges } from '../../../types/profile';

export const getUserProfileInfo = createServerFn({ method: "GET" }).validator((id: string) => id).handler(
    async (params): Promise<Profile> => {
        const backendUrl = process.env.BACKEND_URL ?? "http://localhost:5001";

        const userInfo = fetch(`${backendUrl}/user/${params.data}`, {
            signal: AbortSignal.timeout(10000),
        });
        const questionsInfo = fetch(`${backendUrl}/questions/${params.data}`, {
            signal: AbortSignal.timeout(10000),
        });
        const answersInfo = fetch(`${backendUrl}/answers/${params.data}`, {
            signal: AbortSignal.timeout(10000),
        });
        const tagsInfo = fetch(`${backendUrl}/tags/${params.data}`, {
            signal: AbortSignal.timeout(10000),
        });
        const badgesInfo = fetch(`${backendUrl}/badges/${params.data}`, {
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

