const testComments = (comments) => {
  for (let comment of comments) {
    if (/^((.*)[\*\s\/])?(@internal)([\*\s\/](.*))?$/gm.test(comment.value)) {
      return true;
    }
  }
  return false;
};

module.exports = function logger({ types: t }) {
  return {
    name: "logger",
    visitor: {
      Program(path) {
        path.traverse({
          enter(path) {
            const leadingCommentsList = path.node.leadingComments || [];
            const trailingCommentsList = path.node.trailingComments || [];

            if (testComments(leadingCommentsList)) {
              path.remove();
            } else if (testComments(trailingCommentsList)) {
              t.removeComments(path.node);
            }
          }
        });
      }
    }
  };
};
