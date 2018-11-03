
export class Tutorial {
    public id: number
    public nickname: string
    public imagePaths: string[]
    public page: string
    
    // UI-only properties - these aren't stored in the database
    public currentImage: number
}