import { Fragment, useEffect, useState } from "react";
import type {ErrorComponentProps} from "@tanstack/react-router";
import { Route } from "../$id.tsx"
import DOMPurify from "dompurify";
import parse from "html-react-parser";
import { arrayBuffer } from "node:stream/consumers";
import { cp } from "node:fs";
import { defineConfig } from 'vite';
import { Answers } from '../../../types/profile';
import { useServerFn } from "@tanstack/react-start";
import { editYourAnswer, postYourAnswer } from "../utils/loader.ts";

export function UsersError({ error }: ErrorComponentProps) {
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

export function UsersPage() {
    const posts = Route.useLoaderData();
    const question = posts.questionPost[0]

    // function tagsCount() {
    //     let count: [string, number][] = []
    //     let tagsKeys: string[] = []
    //     let tagsArray: string[] = []
    //     let totalCount = 0
        
        // profile.tagsArr.forEach((tagsStr) => {
        //     tagsStr.tags?.replace(/\>/g, ',').replace(/[<>]/g, '').split(',').forEach((tag) => {
        //         if(tag === "") {

        //         } else {
        //             if (!tagsKeys.includes(tag)) {
        //                 tagsKeys.push(tag)
        //             }
        //             tagsArray.push(tag)
        //         }
        //     })
        // })

        // tagsKeys.forEach((tag) => {
        //     count.push([tag, tagsArray.filter(item => item === tag).length])
        //     totalCount = totalCount + tagsArray.filter(item => item === tag).length
        // })
    //     return(
    //         <div>
    //             <span>{totalCount}</span>
    //             <span>Tags</span>
    //             <div className="grid grid-cols-5">
    //                 {count.map((tag) => (
    //                     <div className="flex gap-1">
    //                         <a href='' className="flex bg-[#e0eaf1]">{tag[0]}</a>
    //                         {tag[1] > 1 ? <span><b>x {tag[1]}</b></span> : ''}
    //                     </div>
    //                 ))}
    //             </div>
    //         </div>
    //     )
    // }

    // function badgesCount() {
    //     let count: number = 0
    //     profile.badges.forEach((badge) => {
    //         count = count + parseInt(badge.count)
    //     }) 
    //     return (
    //         <span>{count}</span>
    //     )
    // }

    function answers(slice?: number, answers_arr: Array<any> = posts.questionPost){
        const [isVisible, setIsVisible] = useState(false)
        const [answerId, setAnswerId] = useState('')

        const changeValue = () => {
            setIsVisible(prev => !prev)
            console.log(answerId)
        }
        const submit = useServerFn(editYourAnswer)

        const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            console.log(answerId)
            await submit({
                data: {
                    id: answerId,
                    answer: JSON.stringify(formData.get('answer-text'))
                },
            })
            setAnswerId('')
            changeValue()
        }

        return (
            answers_arr.slice(slice).map((answer: Record<any, any>) => (
                <div id="answer" className="">
                    <div className="flex py-6">
                        <aside id="side-of-question" className="grid">
                            <div id="votes" className="grid">
                                <span>^</span>
                                <span>{answer.count}</span>
                                <span>⌄</span>
                            </div>
                            <div id="accepted?">
                                { question.acceptedAnswerId === answer.id ? <span>✔</span> : '' }
                            </div>
                        </aside>
                        <div className="grid">
                            <form onSubmit={handleSubmit}>
                                <div id="question-body" className="max-w-165">
                                    { document.getElementById(answer.id) ? <textarea name="answer-text" id={answer.id} className="w-165 border">{DOMPurify.sanitize(new DOMParser().parseFromString(answer.body ?? "", 'text/html').body.textContent.toString() || '')}</textarea> : parse(DOMPurify.sanitize(answer.body ?? ""))}
                                </div>
                                <div id="link-flag" className="flex gap-1">
                                    <span>link</span>
                                    <span> | </span>
                                    <span>flag</span>
                                    <span>|</span>
                                    { !isVisible && <button onClick={() => {setAnswerId(answer.id), changeValue()}} className="border">edit</button>}
                                    { isVisible && <div className="gap-1"><button onClick={() => {setAnswerId(''), changeValue()}} className="border">Cancel</button><button type="submit" className="border">Finish & post</button></div>}
                                
                                    {answer.lastEditDate ? <span>edited { answer.lastEditDate }</span> : ''}

                                    <div id="user-profile-info" className="grid">
                                        <span>answered { answer.creationDate }</span>
                                        <div className="flex">
                                            <div className="bg-amber-400 w-5 h-5"></div>
                                            <div id="profile-info" className="grid">
                                                <a href={"/home/" + answer.ownerUserId} className="text-blue-600 hover:text-blue-800 hover:underline">{ answer.ownerDisplayName === null ? answer.displayName : answer.ownerDisplayName}</a>
                                                <div id="meta" className="flex">
                                                    <span>{ answer.reputation }</span>
                                                    <span>{ answer.gold }</span>
                                                    <span>{ answer.silver }</span>
                                                    <span>{ answer.bronze }</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                            { answer.comments ?
                                <div className="my-4">
                                    <hr/>
                                        {answer.comments.map((commentInfo: Record<any, any>) => (
                                            <div id="comment" className="grid max-w-165">
                                                <div className="py-1">
                                                    <span>{ commentInfo.comment.text} - <a href={"/home/" + commentInfo.comment.userid} className="text-blue-600 hover:text-blue-800 hover:underline">{ commentInfo.user }</a> { commentInfo.comment.creationdate}</span>
                                                </div>
                                                <hr />
                                            </div>
                                        ))}
                                </div>
                                : ''
                            }
                        </div>
                    </div>
                    <hr />
                </div>
            ))
        )
    }

    function acceptedAnswer() {
        if (question.acceptedAnswerId) {
            const sortedAnswers: Array<any> = posts.questionPost.slice(1).sort((a, b) => {
                if (a.id === b.id) return 0;
                if (a.id === question.acceptedAnswerId) return -1;
                if (b.id === question.acceptedAnswerId) return 1;
                return 0
            })
            console.log(sortedAnswers)
            return answers(0, sortedAnswers)
        } else {
            return answers(1)
        }
    }
    
    function postYourAnswerForm() {
        const submit = useServerFn(postYourAnswer)

        const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)

            await submit({
                data: {
                    parentId: question.id,
                    answer: formData.get('answer-text') as string
                },
            })
        }
        return (
            <form onSubmit={handleSubmit}>
                <textarea name="answer-text" id="answer-text" className="border"></textarea>
                <button type="submit" className="border">Post Your Answer</button>
            </form>
        )
    }

    return (
        <div id="app">
            <nav className="w-full size-auto flex flex-wrap items-center justify-between gap-4 bg-[#eeeeee] px-4 py-1">
                <span className="text-gray-600">Stack<b>Exchange</b></span>

                <div className="flex flex-wrap gap-4 items-center">
                    <a href="" className="text-blue-600 hover:text-blue-800 hover:underline"><b>log in</b></a>
                    <span>|</span>
                    <a href="" className="text-blue-600 hover:text-blue-800 hover:underline"><b>careers</b></a>
                    <span>|</span>
                    <a href="" className="text-blue-600 hover:text-blue-800 hover:underline"><b>meta</b></a>
                    <span>|</span>
                    <a href="" className="text-blue-600 hover:text-blue-800 hover:underline"><b>about</b></a>
                    <span>|</span>
                    <a href="" className="text-blue-600 hover:text-blue-800 hover:underline"><b>faq</b></a>
                    <input type="text" placeholder="search" className="w-32 md:w-48 bg-white text-black" />
                </div>
            </nav>   

            <main className="max-w-300 mx-auto">
                <nav id="page-nav" className="w-full size-auto flex flex-wrap items-center gap-1.5 px-4 py-1">
                    <span className="w-62.5 text-center">stack<b>overflow</b></span>

                    <a href="" className="bg-[#777777] px-2 py-0.5 text-white"><b>Questions</b></a>
                    <a href="" className="bg-[#777777] px-2 py-0.5 text-white"><b>Tags</b></a>
                    <a href="" className="bg-[#777777] px-2 py-0.5 text-white"><b>Users</b></a>
                    <a href="" className="bg-[#777777] px-2 py-0.5 text-white"><b>Badges</b></a>
                    <a href="" className="bg-[#777777] px-2 py-0.5 text-white"><b>Unanswered</b></a>
                    <a href="" className="bg-[#777777] px-2 py-0.5 text-white"><b>Ask Question</b></a>
                </nav>

                <div id="posts" className="max-w-185">
                    <div id="question-post-section">
                        <span><b>{ question.title }</b></span>
                        <hr />
                        <div id="question-section-info" className="flex">
                            <aside id="side-of-question" className="grid">
                                <div id="votes" className="grid">
                                    <span>^</span>
                                    <span>{question.count}</span>
                                    <span>⌄</span>
                                </div>
                                <div id="favorites">
                                    <span>*</span>
                                    <span>{ question.favoriteCount }</span>
                                </div>
                            </aside>
                            <div id="question" className="grid">
                                <div id="question-body" className="max-w-165">
                                    { parse(DOMPurify.sanitize(question.body ?? "")) }
                                </div>
                                <div id="tags">
                                    { question.tags }
                                </div>
                                <div id="meta" className="flex mb-5">
                                    <span>flag</span>
                                    { question.lastEditDate ? <span>edited { question.lastEditDate }</span> : ''}
                                    <div id="user-profile-info" className="grid">
                                        <span>asked { question.creationDate }</span>
                                        <div className="flex">
                                            <div id="profile-picture" className="bg-amber-400 w-5 h-5"></div>
                                            <div id="user-info" className="grid">
                                                <a href={"/home/" + question.ownerUserId} className="text-blue-600 hover:text-blue-800 hover:underline">{ question.ownerDisplayName }</a>
                                                <div id="rep-badg" className="flex">
                                                    <span>{ question.reputation }</span>
                                                    <span>{ question.gold }</span>
                                                    <span>{ question.silver }</span>
                                                    <span>{ question.bronze }</span>
                                                </div>
                                                <span>n% accept rate</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                
                                { question.comments ? 
                                    <div>
                                        <hr />
                                        {question.comments.map((commentInfo: Record<any, any>) => (
                                            <div id="comment" className="max-w-165">
                                                <div className="py-1">
                                                    <span>{ commentInfo.comment.text} - <a href={"/home/" + commentInfo.comment.userid} className="text-blue-600 hover:text-blue-800 hover:underline">{ commentInfo.user }</a> { commentInfo.comment.creationdate}</span>
                                                </div>
                                                <hr />
                                            </div>
                                        ))}
                                    </div>
                                    : ''
                                }
                            </div>
                        </div>
                    </div>

                    <div className="flex mt-10">
                        <span>{ posts.questionPost.length -1 } Answres</span>
                        <div className="flex">
                            <button>oldest</button>
                            <button>newest</button>
                            <button>votes</button>
                        </div>
                    </div>
                    <hr />

                    { acceptedAnswer() }
                </div>
                
                    { postYourAnswerForm() }
                <span>user feed</span>
            </main>
        </div>
    );
}