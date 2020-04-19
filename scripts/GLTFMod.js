class GLTFModel{
    constructor(loader, path){
        this.loader = loader, 
        this.path = path; 
        //Some more instance variables
    }   

    onLoad = ( arr, gltf, position, scale ) => {
        
        let model = gltf; 
        arr.push(model);

        var mixer = new THREE.AnimationMixer( model.scene );
       
        var action = mixer.sclipAction(model.animations[ 0 ]);
        action.play();
       
        model.position.copy( position );
        model.scale.copy( scale );
        
    }  

    onProgress = () => {};

    onError = ( errorMessage ) => {console.log( errorMessage );};

}