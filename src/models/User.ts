import { Tutorial } from "src/models/Tutorial";

export class User {
    public name: string;
    public preferences: {
        activeTutorials: Tutorial[]
    } = { activeTutorials: [] }
}