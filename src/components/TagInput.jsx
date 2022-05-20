import { WithContext as ReactTags } from 'react-tag-input';



const KeyCodes = {
    comma: 188,
    enter: 13
};
const delimiters = [KeyCodes.comma, KeyCodes.enter];


const TagInput = ({ type, tags, setTags }) => {

    const handleDelete = i => {
        setTags(tags.filter((tag, index) => index !== i));
    };

    const handleAddition = tag => {
        setTags([...tags, tag]);
    };

    const handleDrag = (tag, currPos, newPos) => {
        const newTags = tags.slice();

        newTags.splice(currPos, 1);
        newTags.splice(newPos, 0, tag);

        // re-render
        setTags(newTags);
    };

    const handleTagClick = index => {
        console.log('The tag at index ' + index + ' was clicked');
    };
    const onClearAll = () => {
        setTags([]);
    };
    const onTagUpdate = (i, newTag) => {
        const updatedTags = tags.slice();
        updatedTags.splice(i, 1, newTag);
        setTags(updatedTags);
    };
    return (
        <>
            <ReactTags
                tags={tags}
                autofocus={true}
                allowAdditionFromPaste={true}
                delimiters={delimiters}
                handleDelete={handleDelete}
                handleAddition={handleAddition}
                handleDrag={handleDrag}
                handleTagClick={handleTagClick}
                onTagUpdate={onTagUpdate}
                inputFieldPosition="bottom"
                placeholder={`Enter new ${type}`}
                editable={true}
                clearAll={true}
                onClearAll={onClearAll}
            />
            {/* <button onClick={handleAddition}>test</button> */}
        </>
    )
}

export default TagInput