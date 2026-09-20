class Beast {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        
        this.mesh = this.createMesh();
        this.scene.add(this.mesh);
        
        this.state = "PATROL"; // PATROL, CHASE, INVESTIGATE, RETURN, STUNNED
        this.patrolPoints = [];
        this.currentPatrolIndex = 0;
        
        this.investigatePosition = null;
        this.chaseTimer = 0;
        this.maxChaseTime = 5.0; // seconds
        
        this.visionDistance = CONFIG.BEAST_VISION_DISTANCE || 9;
        this.visionAngle = CONFIG.BEAST_VISION_ANGLE || Math.PI / 3;
    }

    createMesh() {
        const group = new THREE.Group();
        
        // Large hairy body (Sphere or rough shape)
        const bodyGeo = new THREE.DodecahedronGeometry(1.5, 1);
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0x3b2f2f });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.5;
        group.add(body);
        
        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffeda }); // Yellow eyes
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.5, 2, 1.3);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.5, 2, 1.3);
        group.add(leftEye);
        group.add(rightEye);
        
        group.userData = { isBeast: true };
        
        return group;
    }
    
    setPatrolPoints(points) {
        this.patrolPoints = points;
        this.currentPatrolIndex = 0;
        if (points.length > 0) {
            this.mesh.position.copy(points[0]);
        }
    }

    update(delta) {
        if (this.state === "STUNNED") return;
        
        this.checkVision();
        
        switch (this.state) {
            case "PATROL":
                this.patrol(delta);
                break;
            case "CHASE":
                this.chase(delta);
                break;
            case "INVESTIGATE":
                this.investigate(delta);
                break;
            case "RETURN":
                this.returnToPatrol(delta);
                break;
        }
    }

    checkVision() {
        if (this.state === "CHASE" || this.state === "STUNNED") return;
        if (this.player.isHidden) return;
        
        const dist = this.mesh.position.distanceTo(this.player.mesh.position);
        if (dist < this.visionDistance) {
            // Check angle
            const toPlayer = this.player.mesh.position.clone().sub(this.mesh.position).normalize();
            
            // Forward vector of beast
            const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);
            
            const angle = forward.angleTo(toPlayer);
            if (angle < this.visionAngle) {
                // Seen!
                this.state = "CHASE";
                this.chaseTimer = 0;
                
                // Alert icon or sound could be triggered here
            }
        }
    }

    moveTowards(targetPos, speed, delta) {
        const dir = targetPos.clone().sub(this.mesh.position);
        dir.y = 0; // Keep on ground
        
        if (dir.lengthSq() > 0.01) {
            const moveDist = speed * delta;
            if (dir.length() <= moveDist) {
                this.mesh.position.copy(targetPos);
                this.mesh.position.y = 0;
                return true; // Reached
            } else {
                dir.normalize();
                this.mesh.position.add(dir.multiplyScalar(moveDist));
                
                // Rotate to face movement direction
                const targetAngle = Math.atan2(dir.x, dir.z);
                
                let currentAngle = this.mesh.rotation.y;
                let diff = targetAngle - currentAngle;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                
                this.mesh.rotation.y += diff * 5.0 * delta;
                
                return false;
            }
        }
        return true;
    }

    patrol(delta) {
        if (this.patrolPoints.length === 0) return;
        
        const target = this.patrolPoints[this.currentPatrolIndex];
        const reached = this.moveTowards(target, CONFIG.BEAST_PATROL_SPEED, delta);
        
        if (reached) {
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
        }
    }

    chase(delta) {
        this.chaseTimer += delta;
        if (this.chaseTimer > this.maxChaseTime) {
            this.state = "RETURN";
            return;
        }
        
        if (this.player.isHidden) {
            this.state = "RETURN";
            return;
        }
        
        const target = this.player.mesh.position.clone();
        this.moveTowards(target, CONFIG.BEAST_CHASE_SPEED, delta);
        
        // Check catch
        const dist = this.mesh.position.distanceTo(target);
        if (dist < 1.5) {
            this.catchPlayer();
        }
    }
    
    catchPlayer() {
        this.state = "RETURN";
        
        if (window.dialogueSystem) {
            window.dialogueSystem.start([{ name: "小米", text: "呀！" }], () => {
                // Reset player to checkpoint
                if (gameState.checkpoint) {
                    this.player.setPosition(gameState.checkpoint.x, gameState.checkpoint.y, gameState.checkpoint.z);
                }
            });
        }
    }

    investigate(delta) {
        if (!this.investigatePosition) {
            this.state = "RETURN";
            return;
        }
        
        const reached = this.moveTowards(this.investigatePosition, CONFIG.BEAST_CHASE_SPEED, delta);
        if (reached) {
            // Stay for 3 seconds then return
            this.state = "STUNNED";
            setTimeout(() => {
                if (this.state === "STUNNED") {
                    this.state = "RETURN";
                }
            }, 3000);
        }
    }

    returnToPatrol(delta) {
        if (this.patrolPoints.length === 0) return;
        
        // Find nearest patrol point to return to
        let nearestIndex = 0;
        let minDist = Infinity;
        for (let i = 0; i < this.patrolPoints.length; i++) {
            const dist = this.mesh.position.distanceTo(this.patrolPoints[i]);
            if (dist < minDist) {
                minDist = dist;
                nearestIndex = i;
            }
        }
        this.currentPatrolIndex = nearestIndex;
        
        const target = this.patrolPoints[this.currentPatrolIndex];
        const reached = this.moveTowards(target, CONFIG.BEAST_PATROL_SPEED, delta);
        
        if (reached) {
            this.state = "PATROL";
        }
    }
    
    hearBell(position) {
        if (this.state === "CHASE") return; // Ignore bells while chasing
        this.investigatePosition = position.clone();
        this.state = "INVESTIGATE";
    }
}
