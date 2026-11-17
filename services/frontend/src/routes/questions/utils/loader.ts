//TanStack
import { createServerFn } from "@tanstack/react-start";

//types


export const getQuestionsInfo = createServerFn({ method: "GET" }).validator((id: string) => id).handler(
    async (params) => {
        const backendUrl = process.env.BACKEND_URL ?? "http://localhost:5001";

        const questionsPostInfo = fetch(`${backendUrl}/questionsPost/${params.data}`, {
            
        });

        const [ qRes ] = (await Promise.all([questionsPostInfo]))

        if (!qRes.ok) {
            const { error } = await qRes.json() as { error: string };
            throw new Error(error);
        }
        const questionPost = await qRes.json()

        return {
            questionPost
        };
    },
);

export const postYourAnswer = createServerFn({ method: "POST" })
    .validator((data: {parentId: string, answer: string}) => data)
    .handler(
    async ({data}) => {
        const backendUrl = process.env.BACKEND_URL ?? "http://localhost:5001";

        const questionsPostYourAnswer = fetch(`${backendUrl}/questionsPost/post/`, {
            method: "POST",
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                data
            })
        });
    },
);

export const editYourAnswer = createServerFn({ method: "POST" })
    .validator((data: {id: string, answer: string}) => data)
    .handler(
    async ({data}) => {
        const backendUrl = process.env.BACKEND_URL ?? "http://localhost:5001";

        const questionsPostYourAnswer = fetch(`${backendUrl}/questionsPost/edit/`, {
            method: "POST",
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                data
            })
        });
    },
);