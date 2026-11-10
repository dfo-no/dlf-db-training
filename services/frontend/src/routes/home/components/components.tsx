import { Fragment, useEffect } from "react";
import type {ErrorComponentProps} from "@tanstack/react-router";
import { Route } from "../index.tsx"
import DOMPurify from "dompurify";
import parse from "html-react-parser";
import { Profile } from "../../../types/profile.ts";
import { arrayBuffer } from "node:stream/consumers";

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
    const profile: Profile = Route.useLoaderData();

    function tagsCount() {
        let count: [string, number][] = []
        let tagsKeys: string[] = []
        let tagsArray: string[] = []
        let totalCount = 0
        
        profile.tagsArr.forEach((tagsStr) => {
            tagsStr.tags?.replace(/\>/g, ',').replace(/[<>]/g, '').split(',').forEach((tag) => {
                if(tag === "") {

                } else {
                    if (!tagsKeys.includes(tag)) {
                        tagsKeys.push(tag)
                    }
                    tagsArray.push(tag)
                }
            })
        })

        tagsKeys.forEach((tag) => {
            count.push([tag, tagsArray.filter(item => item === tag).length])
            totalCount = totalCount + tagsArray.filter(item => item === tag).length
        })
        return(
            <div>
                <span>{totalCount}</span>
                <span>Tags</span>
                <div className="grid grid-cols-5">
                    {count.map((tag) => (
                        <div className="flex gap-1">
                            <a href='' className="flex bg-[#e0eaf1]">{tag[0]}</a>
                            {tag[1] > 1 ? <span><b>x {tag[1]}</b></span> : ''}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    function badgesCount() {
        let count: number = 0
        profile.badges.forEach((badge) => {
            count = count + parseInt(badge.count)
        }) 
        return (
            <span>{count}</span>
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

                <div id="profile-section">
                    <span><b>{profile.user.displayName}</b></span>
                    <hr />
                    <div id="profile" className="flex flex-wrap py-5 gap-8">
                        <div id="profile-info-1" className="flex-col ">
                            <span className="w-32 h-32 text-center ">profile picture</span>
                            <div id="reputation" className="flex flex-col">
                                <span>{profile.user.reputation}</span>
                                <span>reputation</span>
                            </div>
                            <span id="views">{profile.user.views} views</span>
                        </div>
                        

                        <div id="profile-info-2" className="grid">
                            <span>Registered User</span>
                            <table className="grid grid-cols-2 gap-0">
                                <tr id="keys-info-2" className="grid">
                                    <td>name</td>
                                    <td>member for</td>
                                    <td>seen</td>
                                    <td>website</td>
                                    <td>location</td>
                                    <td>age</td>
                                </tr>
                                
                                
                                <tr id="values-info-2" className="grid">
                                    <td><b>{profile.user.displayName}</b></td>
                                    <td>{profile.user.creationDate}</td>
                                    <td>{profile.user.lastAccessDate}</td>
                                    <td><a href={profile.user.websiteUrl}>{profile.user.websiteUrl || 'none'}</a></td>
                                    <td>{profile.user.location}</td>
                                    <td>{profile.user.age || 'unknown'}</td>
                                </tr>
                            </table>
                        </div>
                        <div id="profile-info-3" className="bg-[#eeeeee] px-3 py-5">
                            <div>{parse(DOMPurify.sanitize(profile.user.aboutMe ?? ""))}</div>
                        </div>
                    </div>
                    <div id="profile-nav">
                        <button>stats</button>
                        <button>activity</button>
                        <button>reputation</button>
                        <button>favorites</button>
                        <button>account</button>
                    </div>
                    <hr/>
                </div>
                
                <div id="QnA-section">
                    <div id="questions-section">
                        <span>{profile.user.questionsTotal}</span>
                        <span className="underline">Questions</span>
                        {profile.questions.map((question) => (
                            <div id="question-info" className="flex gap-1">
                                <div id="votes" className="grid w-12 h-12 bg-[#eeeeee]">
                                    <span>{question.votes}</span>
                                    <span>votes</span>
                                </div>
                                <div id="answers" className="grid w-12 h-12 bg-[#75845c] text-[#E1E818]">
                                    <span>{question.answerCount}</span>
                                    <span>answers</span>
                                </div>
                                <div id="views" className="grid w-12 h-12">
                                    <span className="text-[#999999]"><b>{question.viewCount}</b></span>
                                    <span className="text-[#999999]"><b>views</b></span>
                                </div>
                                <div id="question-info-2" className="grid">
                                    <a href="" className="text-blue-600 hover:text-blue-800 hover:underline flex"><b>{question.title}</b></a>
                                    <div id="question-tags">
                                        {question.tags?.replace(/\>/g, ',').replace(/[<>]/g, '').split(',').map((tag) => (
                                            <span>{tag}</span>
                                        ))}
                                    </div>
                                    <div id="question-profile-info" className="flex">
                                        <span>{question.lastActivityDate}</span>
                                        <span>{profile.user.displayName}</span>
                                        <span>{profile.user.reputation}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                    </div>
                    <hr />
                    <div id="answers-section">
                        <div id="answers-header">
                            <span>{profile.user.answersTotal}</span>
                            <span>answers</span>
                            <span>sorting func</span>
                        </div>
                        {profile.answers.map((answer) => (
                            <div id="answer" className="flex ">
                                <span className="bg-[#75845c] text-[#E1E818]">{answer.votes}</span>
                                <a href="" className="text-[#555555]"><b>{answer.title}</b></a>
                            </div>
                        ))}
                        <div id="page-selection">
                            <span>page selection func for answers</span>
                        </div>
                    </div>
                </div>
                
                <div id="votes">
                    <span>Votes</span>
                    <div id="votes-up">
                        <span>^</span>
                        <span>{profile.user.upVotes}</span>
                        <span>⌄</span>
                    </div>
                    <div id="votes-down">
                        <span>^</span>
                        <span>{profile.user.downVotes}</span>
                        <span>⌄</span>
                    </div>
                </div>


                {tagsCount()}

                <div id="badges">
                    {badgesCount()}
                    <span>Badges</span>
                    <div className="grid grid-cols-5 gap-2 w-full size-auto items-center justify-between  px-4 py-1">
                        {profile.badges.map((badge) => (
                            <div className="flex">
                                
                                <div className="rounded-sm bg-[#333333] text-white px-2 py-1 items-center justi flex gap-1 max-w-auto max-h-auto min-h-auto min-w-30" >
                                    {badge.class === 1 ? <div className="rounded-full w-1.5 h-1.5 bg-[#ffcc00]"></div> : ''}
                                    {badge.class === 2 ? <div className="rounded-full w-1.5 h-1.5 bg-[#c5c5c5]"></div> : ''}
                                    {badge.class === 3 ? <div className="rounded-full w-1.5 h-1.5 bg-[#cc9966]"></div> : ''}
                                    <a href="">{badge.name}</a>
                                </div>
                                
                                {parseInt(badge.count) > 1 ? <span className=""> x {badge.count}</span> : ''}
                            </div>
                        ))}
                    </div>
                </div>
                <span>user feed</span>
            </main>
        </div>
    );
}