export interface highlightModel {
    highlightedText: string;
    range: highlightedRangeModel;
}

export interface highlightedRangeModel {
    start: number[];
    end: number[];
    startOffset: number;
    endOffset: number;
}

export interface nodePath {
    nodeName: string;
    nodePosition: number;
}