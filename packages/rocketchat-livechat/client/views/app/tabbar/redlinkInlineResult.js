Template.redlinkInlineResult.helpers({
	rawResult(){
		const instance = Template.instance();
		return JSON.stringify(instance.data.result, " ", 2);
	}
});
