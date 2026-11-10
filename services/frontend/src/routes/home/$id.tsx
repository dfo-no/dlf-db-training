import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute('/home/$id')({
    loader: ({ params }) => getUserProfileInfo(params.id),
    component: UsersPage,
    errorComponent: UsersError
})