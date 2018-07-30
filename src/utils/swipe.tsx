import * as React from "react";
import { XY } from "../models/xy";

export interface ISwipeable {
    props: {
        swipeLeft?: (percentComplete: number) => void,
        swipeRight?: (percentComplete: number) => void,
        swipeUp?: () => void,
        swipeDown?: () => void,
        swipingLeft?: (percentComplete: number) => void,
        swipingRight?: (percentComplete: number) => void,
        swipingUp?: (percentComplete: number) => void,
        swipingDown?: (percentComplete: number) => void,
        target?: React.RefObject<any>
    }
}

export class Swipeable
    extends React.Component<{
        swipeLeft?: (percentComplete: number) => void,
        swipeRight?: (percentComplete: number) => void,
        swipeUp?: () => void,
        swipeDown?: () => void,
        swipingLeft?: (percentComplete: number) => void,
        swipingRight?: (percentComplete: number) => void,
        swipingUp?: (percentComplete: number) => void,
        swipingDown?: (percentComplete: number) => void,
        target?: React.RefObject<any>
    }, {}> implements ISwipeable {

    public static swipeSensitivity = 50;

    private touchStartCoordinates: XY = { x: 0, y: 0 };

    constructor(props: {
        swipeLeft?: () => void,
        swipeRight?: () => void,
        swipeUp?: () => void,
        swipeDown?: () => void,
        swipingLeft?: (percentComplete: number) => void,
        swipingRight?: (percentComplete: number) => void,
        swipingUp?: (percentComplete: number) => void,
        swipingDown?: (percentComplete: number) => void,
        target?: React.RefObject<any>
    }) {
        super(props);
    }

    public render() {
        return (
            <div onTouchStart={this.logTouchStart} onTouchEnd={this.touchEnd} onTouchMove={this.touchMove} >
                {this.props.children}
            </div>)
    }

    private touchMove = (e: any) => {
        // compute the largest delta
        const xDelta = this.touchStartCoordinates.x - e.changedTouches[e.changedTouches.length - 1].clientX;
        const yDelta = this.touchStartCoordinates.y - e.changedTouches[e.changedTouches.length - 1].clientY;

        if (Math.abs(xDelta) > Math.abs(yDelta) && Math.abs(xDelta) > Swipeable.swipeSensitivity) {
            if (xDelta > 0) {
                if(this.props.target) {
                    // compute the percent complete of swiping based on the target element, if one was provided
                    const bounds = this.props.target.current.getBoundingClientRect();
                    const percentSwiped = xDelta / (bounds.right - bounds.left)
                    this.props.swipingLeft && this.props.swipingLeft(percentSwiped);
                } 
                else {
                    this.props.swipingLeft && this.props.swipingLeft(1); // if there is no target to calculate the percent complete of swiping, just pretend it's a full swipe?
                }
            }
            else {
                if(this.props.target) {
                    // compute the percent complete of swiping based on the target element, if one was provided
                    const bounds = this.props.target.current.getBoundingClientRect();
                    const percentSwiped = -xDelta / (bounds.right - bounds.left)
                    this.props.swipingRight && this.props.swipingRight(percentSwiped);
                } 
                else {
                    this.props.swipingRight && this.props.swipingRight(1); // if there is no target to calculate the percent complete of swiping, just pretend it's a full swipe?
                }
            }
        } else if (Math.abs(xDelta) < Math.abs(yDelta) && Math.abs(yDelta) > Swipeable.swipeSensitivity) {
            if (yDelta > 0) {
                if(this.props.target) {
                    // compute the percent complete of swiping based on the target element, if one was provided
                    const bounds = this.props.target.current.getBoundingClientRect();
                    const percentSwiped = yDelta / (bounds.top - bounds.bottom)
                    this.props.swipingUp && this.props.swipingUp(percentSwiped);
                } 
                else {
                    this.props.swipingUp && this.props.swipingUp(1); // if there is no target to calculate the percent complete of swiping, just pretend it's a full swipe?
                }
            }
            else {
                if(this.props.target) {
                    // compute the percent complete of swiping based on the target element, if one was provided
                    const bounds = this.props.target.current.getBoundingClientRect();
                    const percentSwiped = -yDelta / (bounds.top - bounds.bottom)
                    this.props.swipingDown && this.props.swipingDown(percentSwiped);
                } 
                else {
                    this.props.swipingDown && this.props.swipingDown(1); // if there is no target to calculate the percent complete of swiping, just pretend it's a full swipe?
                }
            }
        }
    }

    // doesn't seem to like strongly typing 'e' as a TouchEvent due to some shennanigans with libraries and out of date type definitions
    private logTouchStart = (e: any) => {
        this.touchStartCoordinates.x = e.touches[0].clientX;
        this.touchStartCoordinates.y = e.touches[0].clientY;
    }

    private touchEnd = (e: any) => {
        // compute the largest delta
        const xDelta = this.touchStartCoordinates.x - e.changedTouches[e.changedTouches.length - 1].clientX;
        const yDelta = this.touchStartCoordinates.y - e.changedTouches[e.changedTouches.length - 1].clientY;

        if (Math.abs(xDelta) > Math.abs(yDelta) && Math.abs(xDelta) > Swipeable.swipeSensitivity) {
            if (xDelta > 0) {
                if(this.props.target) {
                    // compute the percent complete of swiping based on the target element, if one was provided
                    const bounds = this.props.target.current.getBoundingClientRect();
                    const percentSwiped = xDelta / (bounds.right - bounds.left)
                    this.props.swipeLeft && this.props.swipeLeft(percentSwiped);
                } 
                else {
                    this.props.swipeLeft && this.props.swipeLeft(1); // if there is no target to calculate the percent complete of swiping, just pretend it's a full swipe?
                }
            }
            else {
                if(this.props.target) {
                    // compute the percent complete of swiping based on the target element, if one was provided
                    const bounds = this.props.target.current.getBoundingClientRect();
                    const percentSwiped = -xDelta / (bounds.right - bounds.left)
                    this.props.swipeRight && this.props.swipeRight(percentSwiped);
                } 
                else {
                    this.props.swipeRight && this.props.swipeRight(1); // if there is no target to calculate the percent complete of swiping, just pretend it's a full swipe?
                }
            }
        } else if (Math.abs(xDelta) < Math.abs(yDelta) && Math.abs(yDelta) > Swipeable.swipeSensitivity) {
            if (yDelta > 0) {
                this.props.swipeUp && this.props.swipeUp();
            }
            else {
                this.props.swipeDown && this.props.swipeDown();
            }
        }
    }
}