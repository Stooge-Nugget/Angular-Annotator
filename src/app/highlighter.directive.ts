import { Directive, Output, EventEmitter, ElementRef, NgZone, OnDestroy, OnInit, Input } from '@angular/core';
import { nodePath, highlightModel } from './annotation.model';

@Directive({
  selector: '[appHighlighter]'
})
export class HighlighterDirective implements OnInit, OnDestroy {
  @Output()
  selectedText = new EventEmitter<highlightModel>();

  @Input()
  set annotations(value: highlightModel[]) {
    if (!!value) {
      this.loadAnnotations(value);
    }
  }

  // @Input()
  // hoverComment: any

  private hasSelection = false;

  constructor(private elementRef: ElementRef, private zone: NgZone) { }

  ngOnInit() {
    this.zone.runOutsideAngular(() => {
      this.elementRef.nativeElement.addEventListener("mousedown", this.handleMousedown);
      // document.addEventListener("selectionchange", this.handleSelectionchange);
    });
  }

  ngOnDestroy() {
    this.elementRef.nativeElement.removeEventListener("mousedown", this.handleMousedown);
    document.removeEventListener("mouseup", this.handleMouseup);
    // document.removeEventListener("selectionchange", this.handleSelectionchange);
  }

  private handleMousedown = () => {
    document.addEventListener("mouseup", this.handleMouseup);
  }

  private handleMouseup = () => {
    document.removeEventListener("mouseup", this.handleMouseup);
    this.processSelection();
  }

  // private handleSelectionchange = () => {
  //   if (this.textHighlighted) {
  //     this.processSelection();
  //   }
  // }

  private processSelection() {
    let selection = document.getSelection();

    if (this.hasSelection) {
      this.hasSelection = false;
      this.emitSelection({ highlightedText: "", range: null });
    }

    if (!!selection.rangeCount || !!selection.toString()) {
      this.handleNewSelection(selection);
    }
  }

  private handleNewSelection(selection: Selection) {
    let elRange = selection.getRangeAt(0);
    const startContainerPath: nodePath[] = this.getNodePath(elRange.startContainer);
    const endContainerPath: nodePath[] = this.getNodePath(elRange.endContainer);
    this.hasSelection = true;
    this.emitSelection({
      highlightedText: selection.toString(),
      range: {
        start: startContainerPath.map(n => n.nodePosition),
        end: endContainerPath.map(n => n.nodePosition),
        startOffset: elRange.startOffset,
        endOffset: elRange.endOffset,
      }
    });
  }

  private emitSelection(selection: highlightModel) {
    // Reenter Angular zone, since event handlers are registered within runOutsideAngular,
    // and we want this to trigger change detection on the calling component
    this.zone.runGuarded(() => {
      this.selectedText.emit(selection);
    });
  }

  // Returns an array of node positions for each nested element, relative to the directives element. 
  private getNodePath(startNode: Node) {
    const nodePath: nodePath[] = [];
    let currentNode: Node = startNode;
    while (!!currentNode && currentNode.nodeName !== this.elementRef.nativeElement.nodeName) {
      currentNode = this.getElementNodePosition(currentNode, nodePath);
    }
    nodePath.reverse();
    return nodePath;
  }

  private getElementNodePosition(currentNode: Node, nodePath: nodePath[]) {
    let nodePos = 0;
    let prevSibling = currentNode.previousSibling;
    while (prevSibling != null) {
      nodePos++;
      prevSibling = prevSibling.previousSibling;
    }
    if (!!currentNode.parentNode) {
      nodePath.push({ nodeName: currentNode.nodeName, nodePosition: nodePos });
    }
    currentNode = currentNode.parentNode;
    return currentNode;
  }

  //Annotation loading methods

  private loadAnnotations(annotations: highlightModel[]) {
    const cssClass = "annotator-hl";
    const wrapper = document.createElement('span');
    wrapper.className = cssClass;

    annotations.forEach(a => {
      const startContainer = this.findAnnotation(a.range.start);
      const endContainer = this.findAnnotation(a.range.end);

      const range = document.createRange();
      range.setStart(startContainer, a.range.startOffset);
      range.setEnd(endContainer, a.range.endOffset);

      const textNodeTree = document.createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_TEXT);
      const textNodes = [];

      while(textNodeTree.nextNode()) {
        textNodes.push(textNodeTree.currentNode);
      }

      const startNodePos = textNodes.indexOf(range.startContainer);
      const endNodePos = textNodes.indexOf(range.endContainer);
      const selectedTextNodes = textNodes.slice(startNodePos, endNodePos + 1);

      const lastSelectedNodePos = selectedTextNodes.length - 1;
      const replaceFirstTextNode = selectedTextNodes[0].splitText(range.startOffset);
      selectedTextNodes[0] = replaceFirstTextNode;
      selectedTextNodes[lastSelectedNodePos].splitText(range.endOffset);

      for (let i = 0; i < selectedTextNodes.length; i++) {
        const wrapper = document.createElement('span');
        wrapper.className = 'annotation-hl';
        wrapper.textContent = selectedTextNodes[i].textContent;
        wrapper.addEventListener('mouseover', e => {console.log(e.target)});
        selectedTextNodes[i].parentElement.replaceChild(wrapper, selectedTextNodes[i])
        
      }
    });
  }

  // Find node based on provided node path.
  private findAnnotation(nodePath: number[]): Node {
    let searchNode: Node = this.elementRef.nativeElement;
    nodePath.forEach(n => { searchNode = !!searchNode.childNodes[n] ? searchNode.childNodes[n] : searchNode; });
    return searchNode;
  }
}