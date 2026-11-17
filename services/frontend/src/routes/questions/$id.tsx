import { createFileRoute, type ErrorComponentProps} from "@tanstack/react-router";

//utils 
import {  getQuestionsInfo } from "./utils/loader.ts"

//components
import { UsersPage, UsersError } from './components/components.tsx';

export const Route = createFileRoute("/questions/$id")({
  loader: ({params}) => getQuestionsInfo({data: params.id}),
  component: UsersPage,
  errorComponent: UsersError,
});



