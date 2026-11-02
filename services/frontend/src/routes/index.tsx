import {
  createFileRoute,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect } from "react";

type User = {
  id: number;
  displayName: string | null;
  reputation: number | null;
  location: string | null;
};

const getTopUsers = createServerFn({ method: "GET" }).handler(
  async (): Promise<User[]> => {
    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:5001";
    const response = await fetch(`${backendUrl}/users`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      const { error } = await response.json() as { error: string };
      throw new Error(error);
    }
    return response.json();
  },
);

export const Route = createFileRoute("/")({
  loader: () => getTopUsers(),
  component: UsersPage,
  errorComponent: UsersError,
});

function UsersError({ error }: ErrorComponentProps) {
  useEffect(() => {
    console.error("Root route failed:", error);
  }, [error]);

  return (
    <main>
      <h1>Unable to load users</h1>
      <p>Please check that the backend and database are running.</p>
      <a href="/">Try again</a>
    </main>
  );
}

function UsersPage() {
  const users = Route.useLoaderData();

  return (
    <table aria-label="Top 25 users by reputation">
      <thead>
        <tr>
          <th scope="col">Rank</th>
          <th scope="col">User</th>
          <th scope="col">Reputation</th>
          <th scope="col">Location</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user, index) => (
          <tr key={user.id}>
            <td>{index + 1}</td>
            <th scope="row">{user.displayName || "Unknown user"}</th>
            <td>{user.reputation?.toLocaleString("en-US") ?? "—"}</td>
            <td>{user.location || "—"}</td>
          </tr>
        ))}
        {users.length === 0 && (
          <tr>
            <td colSpan={4}>No users found.</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
