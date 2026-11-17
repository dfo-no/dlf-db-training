import { createFileRoute, type ErrorComponentProps} from "@tanstack/react-router";

//utils 
import {  getUserProfileInfo } from "./utils/loader.ts"

//components
import { UsersPage, UsersError } from './components/components.tsx';

export const Route = createFileRoute("/home/$id")({
  loader: ({params}) => getUserProfileInfo({data: params.id}),
  component: UsersPage,
  errorComponent: UsersError,
});



