import { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float, Stars, Sparkles } from '@react-three/drei';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Camera, RefreshCw, Info } from 'lucide-react';

interface BodySimulationViewProps {
  currentCycleDay: number;
  cycleLength?: number;
}

function UterusModel({ day, cycleLength }: { day: number, cycleLength: number }) {
  // Simple logic for size/color changes
  const periodPhase = day <= 5;
  const lutealPhase = day >= (cycleLength - 12);
  const ovulationDay = Math.floor(cycleLength / 2);
  const isOvulation = Math.abs(day - ovulationDay) <= 1;

  let color = "#ff99aa"; // default pink
  let scale = 1;
  let opacity = 0.9;

  if (periodPhase) {
    color = "#e63946"; // Redder during period (shedding)
    scale = 0.95;
    opacity = 1;
  } else if (isOvulation) {
    color = "#ffccd5"; // Highly vascularized
    scale = 1.05;
  } else if (lutealPhase) {
    color = "#ffb3c1"; // Thicker lining
    scale = 1.1;
  }

  // Animate the uterus slightly (breathing effect)
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // distinct pulsing
  });

  return (
    <group position={[0, -0.5, 0]}>
      {/* Label */}
      <Html position={[0, -2.5, 0]} center>
        <div className="bg-black/50 text-white px-2 py-1 rounded text-xs backdrop-blur-sm whitespace-nowrap">
          Uterus & Endometrium
        </div>
      </Html>

      {/* Uterus Body - stylized as inverted cone/sphere mix */}
      <mesh position={[0, 0, 0]} scale={[1.8 * scale, 2.2 * scale, 1.2 * scale]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
            color={color}
            roughness={0.4}
            metalness={0.1}
            transparent
            opacity={opacity}
        />
      </mesh>
    </group>
  );
}

function OvariesModel({ day, cycleLength }: { day: number, cycleLength: number }) {
  const ovulationDay = Math.floor(cycleLength / 2);
  const follicleGrowthStart = 1;

  // Calculate follicle size: grows from day 1 to ovulationDay
  let follicleScale = 0;
  if (day >= follicleGrowthStart && day <= ovulationDay) {
    const progress = (day - follicleGrowthStart) / (ovulationDay - follicleGrowthStart);
    follicleScale = 0.2 + (progress * 0.5); // Grows from 0.2 to 0.7
  } else if (day > ovulationDay && day < ovulationDay + 2) {
      // Ovulation just happened
      follicleScale = 0.7;
  } else {
      // Corpus luteum regressing
      follicleScale = Math.max(0, 0.7 - ((day - ovulationDay) * 0.1));
  }

  const isOvulation = Math.abs(day - ovulationDay) <= 1;

  return (
    <group>
        {/* Fallopian Tubes - stylized */}
        <mesh position={[-2.2, 1, 0]} rotation={[0, 0, -Math.PI / 6]}>
            <cylinderGeometry args={[0.15, 0.15, 3.5]} />
            <meshStandardMaterial color="#ffccd5" />
        </mesh>
         <mesh position={[2.2, 1, 0]} rotation={[0, 0, Math.PI / 6]}>
            <cylinderGeometry args={[0.15, 0.15, 3.5]} />
            <meshStandardMaterial color="#ffccd5" />
        </mesh>

      {/* Left Ovary */}
      <mesh position={[-3.5, 2, 0]}>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshStandardMaterial color="#ffe5ec" />
        <Html position={[0, 1.2, 0]} center>
            <div className="bg-black/50 text-white px-2 py-1 rounded text-xs backdrop-blur-sm">Ovary</div>
        </Html>

        {/* Follicle / Egg */}
        {day <= ovulationDay + 5 && (
            <mesh position={[0.4, 0.4, 0.6]} scale={[follicleScale, follicleScale, follicleScale]}>
                <sphereGeometry args={[1, 16, 16]} />
                <meshStandardMaterial
                    color={isOvulation ? "#fff" : "#ffffcc"}
                    emissive={isOvulation ? "#fff" : "#ffff00"}
                    emissiveIntensity={isOvulation ? 0.8 : 0.2}
                />
            </mesh>
        )}
      </mesh>

      {/* Floating Egg if Ovulation */}
      {isOvulation && (
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh position={[-1.5, 1.5, 1]}>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
                <Html position={[0.5, 0.5, 0]}>
                    <div className="bg-primary/80 text-primary-foreground px-2 py-1 rounded-full text-xs shadow-lg animate-pulse whitespace-nowrap">
                        Ovulation!
                    </div>
                </Html>
            </mesh>
          </Float>
      )}

      {/* Right Ovary (static for now) */}
      <mesh position={[3.5, 2, 0]}>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshStandardMaterial color="#ffe5ec" />
      </mesh>
    </group>
  );
}

function HormonesVisualization({ day, cycleLength }: { day: number, cycleLength: number }) {
    // Simplified hormone logic
    const ovulationDay = Math.floor(cycleLength / 2);

    // Estrogen peaks before ovulation
    const estrogenLevel = day < ovulationDay ? (day / ovulationDay) : Math.max(0, 1 - ((day - ovulationDay) / 10));

    // Progesterone peaks after ovulation
    const progesteroneLevel = day > ovulationDay ? Math.sin(((day - ovulationDay) / (cycleLength - ovulationDay)) * Math.PI) : 0.1;

    return (
        <group position={[0, 4, 0]}>
             <Html position={[0, 1, 0]} center>
                <div className="flex gap-2 text-xs font-mono whitespace-nowrap">
                    <span className="text-blue-300 bg-black/50 px-1 rounded">Estrogen: {Math.round(estrogenLevel * 100)}%</span>
                    <span className="text-yellow-300 bg-black/50 px-1 rounded">Progesterone: {Math.round(progesteroneLevel * 100)}%</span>
                </div>
            </Html>

            {/* Estrogen Particles (Blue) */}
            <Sparkles
                count={Math.floor(estrogenLevel * 50) + 10}
                scale={6}
                size={2}
                speed={0.4}
                opacity={0.6}
                color="#aec6cf"
                position={[-2, 0, 0]}
            />

             {/* Progesterone Particles (Yellow) */}
             <Sparkles
                count={Math.floor(progesteroneLevel * 50) + 10}
                scale={6}
                size={2}
                speed={0.4}
                opacity={0.6}
                color="#fdfd96"
                position={[2, 0, 0]}
            />
        </group>
    )
}

export function BodySimulationView({ currentCycleDay, cycleLength = 28 }: BodySimulationViewProps) {
  const [isARMode, setIsARMode] = useState(false);
  const [simulationDay, setSimulationDay] = useState(currentCycleDay);
  const webcamRef = useRef<Webcam>(null);

  useEffect(() => {
    setSimulationDay(currentCycleDay);
  }, [currentCycleDay]);

  const toggleARMode = () => setIsARMode(!isARMode);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">Body AR Simulation</h2>
          <p className="text-muted-foreground text-sm">Visualize your internal changes</p>
        </div>
        <div className="flex items-center space-x-2 bg-card p-2 rounded-lg border shadow-sm">
          <Switch id="ar-mode" checked={isARMode} onCheckedChange={setIsARMode} />
          <Label htmlFor="ar-mode" className="flex items-center gap-2 cursor-pointer">
            <Camera className="h-4 w-4" />
            <span className="text-sm font-medium">AR Mode</span>
          </Label>
        </div>
      </div>

      <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border shadow-lg bg-black/5">
        {isARMode ? (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "user" }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-purple-50/50 to-pink-50/50" />
        )}

        <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
          <ambientLight intensity={0.7} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <spotLight position={[-10, 10, 5]} angle={0.3} penumbra={1} intensity={0.5} />

          <group position={[0, -1, 0]}>
             <UterusModel day={simulationDay} cycleLength={cycleLength} />
             <OvariesModel day={simulationDay} cycleLength={cycleLength} />
             <HormonesVisualization day={simulationDay} cycleLength={cycleLength} />
          </group>

          <OrbitControls
            enableZoom={true}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.5}
            minDistance={5}
            maxDistance={15}
          />

          {!isARMode && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
        </Canvas>

        <div className="absolute bottom-4 left-4 right-4 bg-background/80 backdrop-blur-md p-4 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Cycle Day: {simulationDay}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSimulationDay(currentCycleDay)}
              className="h-6 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reset to Today
            </Button>
          </div>
          <Slider
            value={[simulationDay]}
            min={1}
            max={cycleLength}
            step={1}
            onValueChange={(vals) => setSimulationDay(vals[0])}
            className="w-full"
          />
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground px-1">
              <span>Period</span>
              <span>Follicular</span>
              <span>Ovulation</span>
              <span>Luteal</span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
             <Info className="h-5 w-5 text-primary" />
             <CardTitle className="text-lg">What's Happening?</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
           <div className="grid grid-cols-2 gap-4">
               <div className="p-3 bg-muted rounded-lg">
                   <p className="font-semibold text-sm mb-1">Follicle Status</p>
                   <p className="text-xs text-muted-foreground">
                       {simulationDay <= 5 ? "Dormant / Early Recruitment" :
                        simulationDay <= 13 ? "Growing Dominant Follicle" :
                        simulationDay === 14 ? "Ovulation (Release)" : "Corpus Luteum Forming"}
                   </p>
               </div>
               <div className="p-3 bg-muted rounded-lg">
                   <p className="font-semibold text-sm mb-1">Lining Thickness</p>
                   <p className="text-xs text-muted-foreground">
                       {simulationDay <= 5 ? "Shedding (Menstruation)" :
                        simulationDay <= 14 ? "Building Up (Proliferative)" : "Thick & Nutrient-Rich (Secretory)"}
                   </p>
               </div>
           </div>
          <p className="text-sm text-muted-foreground pt-2">
             Drag the slider to see how your body changes throughout the cycle.
             Enable AR mode to visualize these changes in your own environment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
