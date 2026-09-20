class PuzzleManager {
    constructor(scene, interactionManager, levelManager) {
        this.scene = scene;
        this.interactionManager = interactionManager;
        this.levelManager = levelManager;
        
        this.collectedFlowers = 0;
        this.totalFlowers = 3;
        
        this.bellSequence = [];
        this.playerSequence = [];
        this.bellAttempts = 0;
    }

    createFlower(x, z, color, id) {
        const group = new THREE.Group();
        
        // Stem
        const stemGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.6);
        const stemMat = new THREE.MeshLambertMaterial({ color: 0x228b22 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.3;
        group.add(stem);
        
        // Petals
        const petalGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const petalMat = new THREE.MeshLambertMaterial({ color: color });
        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.position.y = 0.7;
        group.add(petal);
        
        group.position.set(x, 0, z);
        
        group.userData = {
            interactable: true,
            type: "flower",
            id: id,
            onInteract: (obj) => this.collectFlower(obj)
        };
        
        this.scene.add(group);
        this.interactionManager.addInteractable(group);
        this.levelManager.currentObjects.push(group);
        
        return group;
    }

    collectFlower(flowerObj) {
        this.collectedFlowers++;
        
        // Remove from scene and interactables
        this.scene.remove(flowerObj);
        this.interactionManager.removeInteractable(flowerObj);
        
        // Update HUD
        this.levelManager.updateObjective(`尋找特殊花朵 ${this.collectedFlowers} / ${this.totalFlowers}`);
        
        if (this.collectedFlowers >= this.totalFlowers) {
            this.levelManager.updateObjective(`前往森林深處`);
            this.createExitPath();
        }
    }

    createExitPath() {
        // Create glowing particles or arrows pointing to the exit
        for (let i = 0; i < 5; i++) {
            const geo = new THREE.BoxGeometry(0.5, 0.1, 0.5);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.8 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(0, 0.1, -5 - i * 3);
            this.scene.add(mesh);
            this.levelManager.currentObjects.push(mesh);
        }
        
        // Exit trigger zone
        const exitGeo = new THREE.BoxGeometry(4, 2, 4);
        const exitMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, visible: false });
        const exitZone = new THREE.Mesh(exitGeo, exitMat);
        exitZone.position.set(0, 1, -20);
        
        exitZone.userData = {
            isTrigger: true,
            hasTriggered: false,
            onEnter: (obj) => {
                if (obj.userData.hasTriggered) return;
                
                if (gameState.level === 1 && this.collectedFlowers >= this.totalFlowers) {
                    obj.userData.hasTriggered = true;
                    window.completeLevel(1);
                } else if (gameState.level === 3 && this.fixedBridgeParts >= 3) {
                    obj.userData.hasTriggered = true;
                    window.completeLevel(3);
                }
            }
        };
        
        this.scene.add(exitZone);
        this.levelManager.currentObjects.push(exitZone);
    }
    
    // --- Level 2 Bell Puzzle ---
    createBell(x, z, colorStr, colorHex, id) {
        const group = new THREE.Group();
        
        // Bell shape
        const bellGeo = new THREE.CylinderGeometry(0.3, 0.6, 1, 16);
        const bellMat = new THREE.MeshLambertMaterial({ color: colorHex });
        const bell = new THREE.Mesh(bellGeo, bellMat);
        bell.position.y = 1;
        group.add(bell);
        
        // Clapper
        const clapperGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const clapperMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const clapper = new THREE.Mesh(clapperGeo, clapperMat);
        clapper.position.y = 0.5;
        group.add(clapper);
        
        group.position.set(x, 0, z);
        
        group.userData = {
            interactable: true,
            type: "bell",
            id: id,
            colorStr: colorStr,
            originalColor: colorHex,
            material: bellMat,
            onInteract: (obj) => this.hitBell(obj)
        };
        
        this.scene.add(group);
        this.interactionManager.addInteractable(group);
        this.levelManager.currentObjects.push(group);
        
        return group;
    }
    
    hitBell(bellObj) {
        // Flash bell and jump
        bellObj.userData.material.color.setHex(0xffffff);
        bellObj.position.y += 0.2;
        setTimeout(() => {
            bellObj.userData.material.color.setHex(bellObj.userData.originalColor);
            bellObj.position.y -= 0.2;
        }, 300);
        
        this.playerSequence.push(bellObj.userData.colorStr);
        
        // Update Objective UI with current sequence
        const colorNames = { "yellow": "黃", "blue": "藍", "red": "紅", "white": "白" };
        const seqText = this.playerSequence.map(c => colorNames[c] || c).join(" → ");
        this.levelManager.updateObjective("已敲擊：" + seqText);
        
        this.checkBellSequence();
    }
    
    checkBellSequence() {
        const currentIndex = this.playerSequence.length - 1;
        
        if (this.playerSequence[currentIndex] !== this.bellSequence[currentIndex]) {
            // Wrong note
            this.bellAttempts++;
            if (window.dialogueSystem) {
                window.dialogueSystem.start([
                    { name: "系統", text: "好像不是這個順序，再聽一次吧！" }
                ], () => {
                    this.resetBellSequence();
                    this.playBellSequenceDemonstration();
                });
            } else {
                this.resetBellSequence();
                this.playBellSequenceDemonstration();
            }
            return;
        }
        
        if (this.playerSequence.length === this.bellSequence.length) {
            // Success
            this.levelManager.updateObjective("前往森林深處尋找媽媽");
            if (window.dialogueSystem) {
                window.dialogueSystem.start([
                    { name: "系統", text: "藤蔓消失了！前方似乎有紅色的身影..." }
                ], () => {
                    // Remove Vines
                    const vines = this.levelManager.currentObjects.find(o => o.userData && o.userData.isVine);
                    if (vines) {
                        this.scene.remove(vines);
                        this.levelManager.currentObjects = this.levelManager.currentObjects.filter(o => o !== vines);
                    }
                    
                    // Spawn Mom in the distance
                    const momGroup = new THREE.Group();
                    const bodyGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.2, 16);
                    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xcc0000 }); // Red dress
                    const body = new THREE.Mesh(bodyGeo, bodyMat);
                    body.position.y = 0.6;
                    momGroup.add(body);
                    const headGeo = new THREE.SphereGeometry(0.4, 16, 16);
                    const headMat = new THREE.MeshLambertMaterial({ color: 0xffcc99 });
                    const head = new THREE.Mesh(headGeo, headMat);
                    head.position.y = 1.4;
                    momGroup.add(head);
                    momGroup.position.set(0, 0, -25);
                    this.scene.add(momGroup);
                    this.levelManager.currentObjects.push(momGroup);
                    
                    momGroup.userData = {
                        interactable: true,
                        type: "npc",
                        id: "mom",
                        hasTriggered: false,
                        onInteract: (obj) => {
                            if (obj.userData.hasTriggered) return;
                            obj.userData.hasTriggered = true;
                            if (window.triggerLevel2Ending) {
                                window.triggerLevel2Ending();
                            }
                        }
                    };
                    this.interactionManager.addInteractable(momGroup);
                    
                    // Add glowing path towards Mom
                    for (let i = 0; i < 4; i++) {
                        const geo = new THREE.BoxGeometry(0.5, 0.1, 0.5);
                        const mat = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.8 });
                        const mesh = new THREE.Mesh(geo, mat);
                        mesh.position.set(0, 0.1, -14 - i * 2.5);
                        this.scene.add(mesh);
                        this.levelManager.currentObjects.push(mesh);
                    }
                    
                    // Exit trigger zone near Mom (Huge to ensure they hit it)
                    const exitGeo = new THREE.BoxGeometry(40, 5, 20);
                    const exitMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, visible: false });
                    const exitZone = new THREE.Mesh(exitGeo, exitMat);
                    exitZone.position.set(0, 1, -22);
                    exitZone.userData = {
                        isTrigger: true,
                        hasTriggered: false,
                        onEnter: (obj) => {
                            if (obj.userData.hasTriggered) return;
                            obj.userData.hasTriggered = true;
                            if (window.triggerLevel2Ending) {
                                window.triggerLevel2Ending();
                            }
                        }
                    };
                    this.scene.add(exitZone);
                    this.levelManager.currentObjects.push(exitZone);
                });
            }
        }
    }
    
    resetBellSequence() {
        this.playerSequence = [];
        this.levelManager.updateObjective("依序敲擊鈴鐺");
        if (this.bellAttempts >= 3) {
            // Hint
            if (window.dialogueSystem) {
                window.dialogueSystem.start([
                    { name: "咕咕", text: `提示：第一個是 ${this.bellSequence[0] === 'yellow' ? '黃色' : this.bellSequence[0]} 的！` }
                ]);
            }
        }
    }
    
    playBellSequenceDemonstration(onComplete) {
        if (!this.bellSequence || this.bellSequence.length === 0) {
            if(onComplete) onComplete();
            return;
        }
        
        let index = 0;
        
        // Find bell objects by colorStr
        const bells = this.levelManager.currentObjects.filter(obj => obj.userData && obj.userData.type === "bell");
        
        const playNext = () => {
            if (index >= this.bellSequence.length) {
                if(onComplete) onComplete();
                return;
            }
            
            const colorStr = this.bellSequence[index];
            const bellObj = bells.find(b => b.userData.colorStr === colorStr);
            
            if (bellObj) {
                bellObj.userData.material.color.setHex(0xffffff);
                setTimeout(() => {
                    bellObj.userData.material.color.setHex(bellObj.userData.originalColor);
                }, 400);
            }
            
            index++;
            setTimeout(playNext, 800);
        };
        
        // Initial delay before playing sequence
        setTimeout(playNext, 500);
    }

    // --- Level 3 Board Puzzle ---
    createBoard(x, z, shape, id) {
        const group = new THREE.Group();
        
        let geo;
        if (shape === 'triangle') geo = new THREE.CylinderGeometry(0, 0.4, 0.1, 3);
        else if (shape === 'circle') geo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);
        else if (shape === 'square') geo = new THREE.BoxGeometry(0.7, 0.1, 0.7);
        
        const mat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 0.05;
        group.add(mesh);
        
        group.position.set(x, 0, z);
        
        group.userData = {
            interactable: true,
            type: "board",
            shape: shape,
            id: id,
            onInteract: (obj) => this.pickupBoard(obj)
        };
        
        this.scene.add(group);
        this.interactionManager.addInteractable(group);
        this.levelManager.currentObjects.push(group);
        
        return group;
    }
    
    pickupBoard(boardObj) {
        if (this.playerHoldingBoard) {
            if (window.dialogueSystem) {
                window.dialogueSystem.start([{ name: "系統", text: "你已經拿著一塊木板了！" }]);
            }
            return;
        }
        
        this.playerHoldingBoard = boardObj.userData.shape;
        this.scene.remove(boardObj);
        this.interactionManager.removeInteractable(boardObj);
        
        if (window.dialogueSystem) {
            window.dialogueSystem.start([{ name: "系統", text: `撿起了一塊 ${boardObj.userData.shape} 木板。` }]);
        }
    }
    
    createBridgeHole(x, z, shape, id) {
        const group = new THREE.Group();
        
        const holeGeo = new THREE.BoxGeometry(1, 0.05, 1);
        const holeMat = new THREE.MeshBasicMaterial({ color: 0x222222 }); // Dark hole
        const hole = new THREE.Mesh(holeGeo, holeMat);
        hole.position.y = 0.02;
        group.add(hole);
        
        group.position.set(x, 0, z);
        
        group.userData = {
            interactable: true,
            type: "hole",
            shape: shape,
            id: id,
            onInteract: (obj) => this.placeBoard(obj)
        };
        
        this.scene.add(group);
        this.interactionManager.addInteractable(group);
        this.levelManager.currentObjects.push(group);
        
        return group;
    }
    
    placeBoard(holeObj) {
        if (!this.playerHoldingBoard) {
            if (window.dialogueSystem) {
                window.dialogueSystem.start([{ name: "系統", text: "你需要一塊木板來修補這裡。" }]);
            }
            return;
        }
        
        if (this.playerHoldingBoard !== holeObj.userData.shape) {
            if (window.dialogueSystem) {
                window.dialogueSystem.start([{ name: "系統", text: "這塊好像放不進去。" }]);
            }
            return;
        }
        
        // Success placement
        this.playerHoldingBoard = null;
        this.fixedBridgeParts++;
        
        // Visual fix
        const plankGeo = new THREE.BoxGeometry(1, 0.1, 1);
        const plankMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const plank = new THREE.Mesh(plankGeo, plankMat);
        plank.position.copy(holeObj.position);
        plank.position.y = 0.05;
        this.scene.add(plank);
        this.levelManager.currentObjects.push(plank);
        
        // Remove hole
        this.scene.remove(holeObj);
        this.interactionManager.removeInteractable(holeObj);
        
        if (this.fixedBridgeParts >= 3) {
            this.levelManager.updateObjective("過橋繼續找媽媽");
            if (window.dialogueSystem) {
                window.dialogueSystem.start([
                    { name: "木木", text: "橋修好了！快去吧！" },
                    { name: "小米", text: "嗯！我要把媽媽找回來。" }
                ], () => {
                    this.createExitPath(); // From Level 1, reuse logic
                });
            }
        } else {
            if (window.dialogueSystem) {
                window.dialogueSystem.start([{ name: "系統", text: "放好了！還差幾個洞。" }]);
            }
        }
    }
    
    // --- Level 4 Star Puzzle and Bells ---
    createDistractorBell(x, z, id) {
        const group = new THREE.Group();
        
        const bellGeo = new THREE.CylinderGeometry(0.2, 0.4, 0.6, 16);
        const bellMat = new THREE.MeshLambertMaterial({ color: 0xc0c0c0 });
        const bell = new THREE.Mesh(bellGeo, bellMat);
        bell.position.y = 0.6;
        group.add(bell);
        
        group.position.set(x, 0, z);
        
        group.userData = {
            interactable: true,
            type: "distractor_bell",
            id: id,
            onInteract: (obj) => {
                if (window.dialogueSystem) {
                    window.dialogueSystem.start([{ name: "系統", text: "（鈴鈴鈴～）" }]);
                }
                if (window.currentBeast) {
                    window.currentBeast.hearBell(obj.position);
                }
            }
        };
        
        this.scene.add(group);
        this.interactionManager.addInteractable(group);
        this.levelManager.currentObjects.push(group);
    }
    
    createStarStone(x, z, colorStr, colorHex, id) {
        const group = new THREE.Group();
        
        const baseGeo = new THREE.BoxGeometry(0.6, 0.2, 0.6);
        const baseMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.1;
        group.add(base);
        
        const starGeo = new THREE.OctahedronGeometry(0.3);
        const starMat = new THREE.MeshLambertMaterial({ color: 0x333333 }); // dark initially
        const star = new THREE.Mesh(starGeo, starMat);
        star.position.y = 0.6;
        group.add(star);
        
        group.position.set(x, 0, z);
        
        group.userData = {
            interactable: true,
            type: "star_stone",
            colorStr: colorStr,
            litColor: colorHex,
            material: starMat,
            isLit: false,
            id: id,
            onInteract: (obj) => this.lightStar(obj)
        };
        
        this.scene.add(group);
        this.interactionManager.addInteractable(group);
        this.levelManager.currentObjects.push(group);
        this.starStones = this.starStones || [];
        this.starStones.push(group);
    }
    
    lightStar(obj) {
        if (obj.userData.isLit) return;
        
        obj.userData.isLit = true;
        obj.userData.material.color.setHex(obj.userData.litColor);
        obj.userData.material.emissive.setHex(obj.userData.litColor);
        
        this.playerSequence.push(obj.userData.colorStr);
        
        const currentIndex = this.playerSequence.length - 1;
        if (this.playerSequence[currentIndex] !== this.starSequence[currentIndex]) {
            // Wrong
            this.starAttempts++;
            if (window.dialogueSystem) {
                window.dialogueSystem.start([{ name: "系統", text: "順序好像不對。" }], () => {
                    this.resetStars();
                });
            } else {
                this.resetStars();
            }
            return;
        }
        
        if (this.playerSequence.length === this.starSequence.length) {
            // Final phase
            if (window.dialogueSystem) {
                window.dialogueSystem.start([
                    { name: "系統", text: "三顆星光石都亮了！" }
                ], () => {
                    if (window.triggerFinalPhase) {
                        window.triggerFinalPhase();
                    }
                });
            }
        }
    }
    
    resetStars() {
        this.playerSequence = [];
        for (let star of this.starStones) {
            star.userData.isLit = false;
            star.userData.material.color.setHex(0x333333);
            star.userData.material.emissive.setHex(0x000000);
        }
        
        if (this.starAttempts >= 3) {
            // Flash first star
            const firstStarColor = this.starSequence[0];
            const firstStar = this.starStones.find(s => s.userData.colorStr === firstStarColor);
            if (firstStar) {
                let count = 0;
                let blink = setInterval(() => {
                    if (count % 2 === 0) {
                        firstStar.userData.material.emissive.setHex(firstStar.userData.litColor);
                    } else {
                        firstStar.userData.material.emissive.setHex(0x000000);
                    }
                    count++;
                    if (count > 5) clearInterval(blink);
                }, 500);
            }
        }
    }
}
