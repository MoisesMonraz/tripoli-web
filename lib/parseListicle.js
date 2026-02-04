/**
 * Tripoli Media - Listicle Parser
 * 
 * Parses Rich Text content from Contentful and divides it into structured parts
 * for the "Golden Layout" with 3 image injection points.
 * 
 * GOLDEN LAYOUT:
 * [Intro] -> [Image1] -> [Items 1-5] -> [Image2] -> [Items 6-10] -> [Image3] -> [Closing]
 */

/**
 * Extract plain text from a Rich Text node recursively
 */
function extractText(node) {
    if (!node) return '';
    if (node.nodeType === 'text') return node.value || '';
    if (node.content && Array.isArray(node.content)) {
        return node.content.map(extractText).join('');
    }
    return '';
}

/**
 * Check if a node starts with a numbered pattern like "1.", "2.", etc.
 */
function startsWithNumber(node) {
    const text = extractText(node).trim();
    return /^\d+\./.test(text);
}

/**
 * Check if a node contains bold text at the start (typical for list item titles)
 */
function hasBoldStart(node) {
    if (!node || !node.content || !Array.isArray(node.content)) return false;
    const firstChild = node.content[0];
    if (!firstChild) return false;

    // Check if first child has bold marks
    if (firstChild.marks && firstChild.marks.some(m => m.type === 'bold')) {
        return true;
    }

    // Check nested content
    if (firstChild.content && firstChild.content[0]?.marks) {
        return firstChild.content[0].marks.some(m => m.type === 'bold');
    }

    return false;
}

/**
 * Detect if a paragraph is likely a list item (numbered or bold start)
 */
function isListItem(node) {
    if (node.nodeType !== 'paragraph') return false;
    return startsWithNumber(node) || hasBoldStart(node);
}

/**
 * Parse the Rich Text content and divide it into Golden Layout parts
 * 
 * @param {Object} richText - The Rich Text document from Contentful
 * @returns {Object} - { intro, part1, part2, part3, closing, listItems }
 */
export function parseListicleContent(richText) {
    if (!richText || !Array.isArray(richText.content)) {
        return {
            intro: richText,
            part1: null,
            part2: null,
            part3: null,
            closing: null,
            listItems: [],
            isListicle: false,
        };
    }

    const nodes = richText.content;
    const listItems = [];
    let introNodes = [];
    let closingNodes = [];
    let foundFirstListItem = false;
    let lastListItemIndex = -1;

    // First pass: identify list items and their positions
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        if (isListItem(node)) {
            if (!foundFirstListItem) {
                foundFirstListItem = true;
                // Everything before this is intro
                introNodes = nodes.slice(0, i);
            }
            listItems.push({ index: i, node });
            lastListItemIndex = i;
        }
    }

    // If we found list items, everything after the last one is closing
    if (lastListItemIndex !== -1 && lastListItemIndex < nodes.length - 1) {
        closingNodes = nodes.slice(lastListItemIndex + 1);
    }

    console.log('📋 Listicle parsing:', {
        totalNodes: nodes.length,
        introNodes: introNodes.length,
        listItemsFound: listItems.length,
        closingNodes: closingNodes.length,
    });

    // If we have 10+ list items, create the Golden Layout
    if (listItems.length >= 10) {
        // Items 1-5 (indices 0-4 in listItems array)
        const items1to5Indices = listItems.slice(0, 5).map(item => item.index);
        const minIndex1 = Math.min(...items1to5Indices);
        const maxIndex1 = Math.max(...items1to5Indices);

        // Items 6-10 (indices 5-9 in listItems array)
        const items6to10Indices = listItems.slice(5, 10).map(item => item.index);
        const minIndex2 = Math.min(...items6to10Indices);
        const maxIndex2 = Math.max(...items6to10Indices);

        return {
            intro: { ...richText, content: introNodes },
            part1: { ...richText, content: nodes.slice(minIndex1, maxIndex1 + 1) }, // Items 1-5
            part2: { ...richText, content: nodes.slice(minIndex2, maxIndex2 + 1) }, // Items 6-10
            part3: null, // Reserved for future use
            closing: { ...richText, content: closingNodes },
            listItems: listItems.length,
            isListicle: true,
        };
    }

    // Fallback: not a proper listicle, divide by node count
    if (nodes.length >= 6) {
        const third = Math.floor(nodes.length / 3);
        return {
            intro: { ...richText, content: nodes.slice(0, 1) },
            part1: { ...richText, content: nodes.slice(1, third + 1) },
            part2: { ...richText, content: nodes.slice(third + 1, third * 2 + 1) },
            part3: { ...richText, content: nodes.slice(third * 2 + 1) },
            closing: null,
            listItems: 0,
            isListicle: false,
        };
    }

    // Not enough content for splitting
    return {
        intro: richText,
        part1: null,
        part2: null,
        part3: null,
        closing: null,
        listItems: 0,
        isListicle: false,
    };
}

/**
 * Alternative: Split content by detecting numbered patterns in text
 * This is useful when items are inside a single paragraph node
 */
export function splitParagraphByNumbers(paragraph) {
    if (!paragraph || paragraph.nodeType !== 'paragraph') {
        return [paragraph];
    }

    const text = extractText(paragraph);

    // Check if paragraph contains multiple numbered items
    const matches = text.match(/\d+\.\s+[A-Z]/g);
    if (!matches || matches.length <= 1) {
        return [paragraph];
    }

    // This paragraph contains multiple list items - we need to split it
    // For now, return as-is since splitting Rich Text nodes is complex
    console.log('⚠️ Found paragraph with', matches.length, 'embedded list items');

    return [paragraph];
}
