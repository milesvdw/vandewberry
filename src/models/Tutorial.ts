
export class Tutorial {
    id: number
    nickname: string
    imagePaths: string[]
    page: string
    
    // UI-only properties - these aren't stored in the database
    currentImage: number
}