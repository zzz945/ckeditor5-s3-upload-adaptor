/**
 * @module upload/adapters/s3UploadAdaptor
 */

 import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
 import FileRepository from '@ckeditor/ckeditor5-upload/src/filerepository';
 import CryptoJS from 'crypto-js';
 // import { addAsset, initS3 } from './s3';
 import { addAsset, initS3, addAssetMultipart } from './s3';
 
 export default class SimpleUploadAdapter extends Plugin {
   /**
    * @inheritDoc
    */
   static get requires() {
     return [ FileRepository ];
   }
 
   /**
    * @inheritDoc
    */
   static get pluginName() {
     return 'SimpleUploadAdapter';
   }
 
   /**
    * @inheritDoc
    */
   init() {
     const options = this.editor.config.get( 's3Upload' );
 
     if ( !options ) {
       return;
     }
 
     initS3(options)
 
     this.editor.plugins.get( FileRepository ).createUploadAdapter = loader => {
       return new Adapter( loader, options );
     };
   }
 }
 
 /**
  * Upload adapter.
  *
  * @private
  * @implements module:upload/filerepository~UploadAdapter
  */
 class Adapter {
   /**
    * Creates a new adapter instance.
    *
    * @param {module:upload/filerepository~FileLoader} loader
    * @param {module:upload/adapters/simpleuploadadapter~SimpleUploadConfig} options
    */
   constructor( loader, options ) {
     /**
      * FileLoader instance to use during the upload.
      *
      * @member {module:upload/filerepository~FileLoader} #loader
      */
     this.loader = loader;
 
     /**
      * The configuration of the adapter.
      *
      * @member {module:upload/adapters/simpleuploadadapter~SimpleUploadConfig} #options
      */
     this.options = options;
   }
 
   /**
    * Starts the upload process.
    *
    * @see module:upload/filerepository~UploadAdapter#upload
    * @returns {Promise}
    */
   upload() {
     return this.loader.file
       .then( file => new Promise( ( resolve, reject ) => {
         const reader = new FileReader();
         reader.onload = event => {
           const binary = event.target.result;
           const md5 = CryptoJS.MD5(binary).toString();
           const prefix = 'test'
           const fileName = encodeURIComponent(`${md5}_${file.name}`)
           // const _addAsset = file.size > 1024 * 1024 * 5 ? addAssetMultipart : addAsset
           addAssetMultipart(file, prefix, fileName, ({ loaded, total }) => {
             this.loader.uploadTotal = total;
             this.loader.uploaded = loaded;
           }).then(({ Location: url }) => {
             WIKI.$emit('editorUploaded', {
               name: file.name,
               url
             });
 
             console.info("Successfully uploaded asset.");
 
             resolve({ 
               default: url,
               fileName: file.name
             });
           }).catch(err => {
             console.error("There was an error uploading your asset: ", err.message);
             reject(err)
           })
         };
         reader.readAsBinaryString(file);
       } ) );
   }
 
   /**
    * Aborts the upload process.
    *
    * @see module:upload/filerepository~UploadAdapter#abort
    * @returns {Promise}
    */
   abort() {
     if ( this.xhr ) {
       this.xhr.abort();
     }
   }
 }
 