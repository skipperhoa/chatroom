/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see https://ckeditor.com/legal/ckeditor-oss-license
 */

CKEDITOR.editorConfig = function( config ) {
	// Define changes to default configuration here. For example:
	// config.language = 'fr';
    // config.uiColor = '#AADC6E';
   // config.extraPlugins = 'cloudservices';
    config.extraPlugins = 'syntaxhighlight';
    config.removePlugins = 'easyimage, cloudservices';
    
	   //config.filebrowserBrowseUrl = '/ckfinder/ckfinder.html';

       // config.filebrowserImageBrowseUrl = '/ckfinder/ckfinder.html?type=Images';

        //config.filebrowserFlashBrowseUrl = '/ckfinder/ckfinder.html?type=Flash';

       // config.filebrowserUploadUrl = '/ckfinder/core/connector/php/connector.php?command=QuickUpload&type=Files';

        //config.filebrowserImageUploadUrl = '/ckfinder/core/connector/php/connector.php?command=QuickUpload&type=Images';
//
        //config.filebrowserFlashUploadUrl = '/ckfinder/core/connector/php/connector.php?command=QuickUpload&type=Flash';
		
		//config.filebrowserBrowseUrl = '/bower_components/elFinder-2.1.49/elfinder.html'; // eg. 'includes/elFinder/elfinder-cke.html'
	//	config.filebrowserBrowseUrl = '/bower_components/elFinder-2.1.49/elfinder.html'; // eg. 'includes/elFinder/elfinder-cke.html'
};
