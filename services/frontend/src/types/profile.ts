export type User = {
    reputation: number | null;
    views: number | null;
    displayName: string | null;
    creationDate: string;
    lastAccessDate: string;
    websiteUrl: string | undefined;
    location: string | null;
    aboutMe: string | null | undefined;
    upVotes: number | null;
    downVotes: number | null;
    questionsTotal: number | null;
    answersTotal: number | null;
};

export type Questions = {
    votes: number | null;
    answerCount: number | null;
    viewCount: number | null;
    title: string | null;
    tags: string | null;
    lastActivityDate: string;
};

export type Answers = {
    votes: number | null;
    title: string | null;
};

export type Tags = {
    tags: string | null;
};

export type Badges = {
    name: string | null;
    class: number | null;
    count: string;
};

export type Profile = {
    user: User;
    questions: Questions[];
    answers: Answers[];
    tagsArr: Tags[];
    badges: Badges[];
};