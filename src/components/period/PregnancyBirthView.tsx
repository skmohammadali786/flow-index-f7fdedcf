import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, differenceInDays, addDays, addWeeks } from 'date-fns';
import { Baby, Heart, Calendar, Stethoscope, ClipboardList, Moon, Activity, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useFertilityTracker, PregnancyRecord, BirthRecord, PostpartumLog } from '@/hooks/useFertilityTracker';
import { startOfDay } from 'date-fns';
import { toast } from 'sonner';

const PREGNANCY_SYMPTOMS = [
  'nausea', 'fatigue', 'back_pain', 'headache', 'heartburn', 
  'swelling', 'insomnia', 'constipation', 'cramping', 'spotting',
  'round_ligament_pain', 'shortness_of_breath', 'frequent_urination'
];

const PHYSICAL_PP_SYMPTOMS = [
  'perineal_pain', 'c_section_pain', 'breast_engorgement', 'hemorrhoids',
  'constipation', 'sweating', 'hair_loss', 'back_pain', 'fatigue'
];

const EMOTIONAL_PP_SYMPTOMS = [
  'baby_blues', 'anxiety', 'overwhelmed', 'joy', 'bonding_difficulty',
  'mood_swings', 'crying_spells', 'irritability', 'loneliness'
];

// Baby size comparisons by week
const BABY_SIZE: Record<number, string> = {
  4: 'Poppy seed', 5: 'Sesame seed', 6: 'Lentil', 7: 'Blueberry', 8: 'Raspberry',
  9: 'Cherry', 10: 'Strawberry', 11: 'Lime', 12: 'Plum', 13: 'Peach',
  14: 'Lemon', 15: 'Apple', 16: 'Avocado', 17: 'Pear', 18: 'Bell pepper',
  19: 'Mango', 20: 'Banana', 22: 'Papaya', 24: 'Corn', 26: 'Lettuce',
  28: 'Eggplant', 30: 'Cabbage', 32: 'Squash', 34: 'Pineapple',
  36: 'Honeydew', 38: 'Watermelon', 40: 'Pumpkin',
};

const getBabySize = (week: number) => {
  const weeks = Object.keys(BABY_SIZE).map(Number).sort((a, b) => a - b);
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (week >= weeks[i]) return BABY_SIZE[weeks[i]];
  }
  return 'Tiny!';
};

export function PregnancyBirthView() {
  const {
    pregnancies,
    pregnancyLogs,
    birthRecords,
    postpartumLogs,
    createPregnancy,
    getActivePregnancy,
    getPregnancyWeek,
    savePregnancyLog,
    saveBirthRecord,
    savePostpartumLog,
  } = useFertilityTracker();

  const activePregnancy = getActivePregnancy();
  const currentWeek = activePregnancy ? getPregnancyWeek(activePregnancy) : 0;
  const latestBirth = birthRecords[0];

  // New pregnancy form
  const [showNewPreg, setShowNewPreg] = useState(false);
  const [lpDate, setLpDate] = useState('');
  const [conDate, setConDate] = useState('');

  // Pregnancy log form
  const [pregWeight, setPregWeight] = useState('');
  const [bpSys, setBpSys] = useState('');
  const [bpDia, setBpDia] = useState('');
  const [babyMoves, setBabyMoves] = useState('');
  const [pregSymptoms, setPregSymptoms] = useState<string[]>([]);
  const [pregMood, setPregMood] = useState('');
  const [pregNotes, setPregNotes] = useState('');
  const [apptNotes, setApptNotes] = useState('');

  // Birth form
  const [showBirthForm, setShowBirthForm] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthType, setBirthType] = useState('');
  const [babyName, setBabyName] = useState('');
  const [babyWeight, setBabyWeight] = useState('');
  const [babyLength, setBabyLength] = useState('');
  const [babyGender, setBabyGender] = useState('');
  const [birthLoc, setBirthLoc] = useState('');
  const [birthNotes, setBirthNotes] = useState('');

  // Postpartum form
  const [ppMood, setPpMood] = useState([5]);
  const [ppAnxiety, setPpAnxiety] = useState([3]);
  const [ppSleep, setPpSleep] = useState('');
  const [ppBleeding, setPpBleeding] = useState('');
  const [ppPain, setPpPain] = useState([3]);
  const [ppBreastfeeding, setPpBreastfeeding] = useState(false);
  const [ppPhysical, setPpPhysical] = useState<string[]>([]);
  const [ppEmotional, setPpEmotional] = useState<string[]>([]);
  const [ppNotes, setPpNotes] = useState('');

  const handleCreatePregnancy = async () => {
    if (!lpDate && !conDate) { toast.error('Enter last period or conception date'); return; }
    const refDate = lpDate ? new Date(lpDate) : addDays(new Date(conDate), -14);
    const dueDate = addDays(refDate, 280);
    await createPregnancy({
      last_period_date: lpDate || undefined,
      conception_date: conDate || undefined,
      due_date: format(dueDate, 'yyyy-MM-dd'),
    });
    setShowNewPreg(false);
  };

  const handleSavePregnancyLog = async () => {
    if (!activePregnancy) return;
    await savePregnancyLog(new Date(), activePregnancy.id, {
      week_number: currentWeek,
      weight: pregWeight ? parseFloat(pregWeight) : null,
      blood_pressure_systolic: bpSys ? parseInt(bpSys) : null,
      blood_pressure_diastolic: bpDia ? parseInt(bpDia) : null,
      baby_movements: babyMoves ? parseInt(babyMoves) : null,
      symptoms: pregSymptoms,
      mood: pregMood || null,
      appointment_notes: apptNotes?.slice(0, 500) || null,
      notes: pregNotes?.slice(0, 500) || null,
    });
    toast.success('Pregnancy log saved!');
  };

  const handleSaveBirth = async () => {
    if (!birthDate) { toast.error('Birth date required'); return; }
    await saveBirthRecord({
      pregnancy_id: activePregnancy?.id || null,
      birth_date: birthDate,
      birth_time: birthTime || null,
      birth_type: birthType as any || null,
      baby_name: babyName?.slice(0, 100) || null,
      baby_weight: babyWeight ? parseFloat(babyWeight) : null,
      baby_length: babyLength ? parseFloat(babyLength) : null,
      baby_gender: babyGender as any || null,
      birth_location: birthLoc?.slice(0, 200) || null,
      birth_notes: birthNotes?.slice(0, 500) || null,
    });
    setShowBirthForm(false);
  };

  const handleSavePostpartum = async () => {
    await savePostpartumLog(new Date(), {
      birth_record_id: latestBirth?.id || null,
      mood_rating: ppMood[0],
      anxiety_level: ppAnxiety[0],
      sleep_hours: ppSleep ? parseFloat(ppSleep) : null,
      bleeding_intensity: ppBleeding as any || null,
      pain_level: ppPain[0],
      breastfeeding: ppBreastfeeding,
      physical_symptoms: ppPhysical,
      emotional_symptoms: ppEmotional,
      notes: ppNotes?.slice(0, 500) || null,
    });
    toast.success('Postpartum log saved!');
  };

  // Postpartum chart data
  const ppChartData = useMemo(() => {
    return postpartumLogs
      .slice(0, 30)
      .reverse()
      .map(l => ({
        date: format(new Date(l.date), 'MMM d'),
        mood: l.mood_rating,
        anxiety: l.anxiety_level,
        pain: l.pain_level,
        sleep: l.sleep_hours,
      }));
  }, [postpartumLogs]);

  // Pregnancy weight chart
  const pregChartData = useMemo(() => {
    return pregnancyLogs
      .filter(l => l.weight)
      .slice(0, 40)
      .reverse()
      .map(l => ({
        week: `W${l.week_number || '?'}`,
        weight: l.weight,
        movements: l.baby_movements,
      }));
  }, [pregnancyLogs]);

  const trimester = currentWeek <= 13 ? '1st' : currentWeek <= 26 ? '2nd' : '3rd';
  const daysLeft = activePregnancy ? Math.max(0, differenceInDays(new Date(activePregnancy.due_date), new Date())) : 0;

  return (
    <div className="space-y-6">
      <Tabs defaultValue={activePregnancy ? 'pregnancy' : latestBirth ? 'postpartum' : 'pregnancy'} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pregnancy">Pregnancy</TabsTrigger>
          <TabsTrigger value="birth">Birth</TabsTrigger>
          <TabsTrigger value="postpartum">Postpartum</TabsTrigger>
        </TabsList>

        {/* PREGNANCY TAB */}
        <TabsContent value="pregnancy" className="space-y-4 mt-4">
          {activePregnancy ? (
            <>
              {/* Pregnancy Dashboard */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="p-5 border-none shadow-card gradient-primary text-primary-foreground">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm opacity-80">Week {currentWeek} · {trimester} Trimester</p>
                      <h2 className="text-3xl font-display font-bold mt-1">{daysLeft}</h2>
                      <p className="text-sm opacity-80">days until due date</p>
                      <p className="text-xs mt-2 opacity-70">Due: {format(new Date(activePregnancy.due_date), 'MMMM d, yyyy')}</p>
                    </div>
                    <div className="text-right">
                      <Baby className="h-8 w-8 opacity-80 mb-2" />
                      <p className="text-sm font-medium">{getBabySize(currentWeek)}</p>
                      <p className="text-xs opacity-70">baby size</p>
                    </div>
                  </div>
                  {/* Week progress */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs opacity-70 mb-1">
                      <span>0</span><span>40 weeks</span>
                    </div>
                    <div className="h-2 rounded-full bg-primary-foreground/20">
                      <div className="h-2 rounded-full bg-primary-foreground/80 transition-all" style={{ width: `${Math.min(100, (currentWeek / 40) * 100)}%` }} />
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Daily Pregnancy Log */}
              <Card className="p-4 border-none shadow-card space-y-3">
                <h3 className="font-display font-semibold text-sm flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" /> Today's Log
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Weight</label>
                    <Input type="number" placeholder="lbs" value={pregWeight} onChange={e => setPregWeight(e.target.value)} className="text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Baby Kicks</label>
                    <Input type="number" placeholder="count" value={babyMoves} onChange={e => setBabyMoves(e.target.value)} className="text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">BP Systolic</label>
                    <Input type="number" placeholder="mmHg" value={bpSys} onChange={e => setBpSys(e.target.value)} className="text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">BP Diastolic</label>
                    <Input type="number" placeholder="mmHg" value={bpDia} onChange={e => setBpDia(e.target.value)} className="text-sm" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Symptoms</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PREGNANCY_SYMPTOMS.map(s => (
                      <Badge
                        key={s}
                        variant={pregSymptoms.includes(s) ? 'default' : 'outline'}
                        className="cursor-pointer text-xs capitalize"
                        onClick={() => setPregSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                      >
                        {s.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Textarea placeholder="Appointment notes..." value={apptNotes} onChange={e => setApptNotes(e.target.value)} maxLength={500} className="text-sm" />
                <Textarea placeholder="Other notes..." value={pregNotes} onChange={e => setPregNotes(e.target.value)} maxLength={500} className="text-sm" />

                <Button onClick={handleSavePregnancyLog} className="w-full">Save Today's Log</Button>
              </Card>

              {/* Pregnancy Charts */}
              {pregChartData.length >= 2 && (
                <Card className="p-4 border-none shadow-card">
                  <h3 className="font-display font-semibold mb-3 text-sm">Weight & Kick Trends</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={pregChartData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="weight" stroke="hsl(355 70% 65%)" name="Weight" dot={false} />
                        <Line type="monotone" dataKey="movements" stroke="hsl(280 40% 75%)" name="Kicks" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-6 border-none shadow-card text-center space-y-4">
              {!showNewPreg ? (
                <>
                  <Baby className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">No active pregnancy</p>
                  <Button onClick={() => setShowNewPreg(true)} className="gradient-primary text-primary-foreground">
                    <Plus className="h-4 w-4 mr-2" /> Start Pregnancy Tracking
                  </Button>
                </>
              ) : (
                <div className="space-y-3 text-left">
                  <h3 className="font-display font-semibold">New Pregnancy</h3>
                  <div>
                    <label className="text-xs text-muted-foreground">Last Period Date</label>
                    <Input type="date" value={lpDate} onChange={e => setLpDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Or Conception Date</label>
                    <Input type="date" value={conDate} onChange={e => setConDate(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreatePregnancy} className="flex-1">Calculate & Start</Button>
                    <Button variant="outline" onClick={() => setShowNewPreg(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </TabsContent>

        {/* BIRTH TAB */}
        <TabsContent value="birth" className="space-y-4 mt-4">
          {birthRecords.length > 0 && (
            <div className="space-y-3">
              {birthRecords.map(b => (
                <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className="p-4 border-none shadow-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-display font-semibold">{b.baby_name || 'Baby'}</h3>
                        <p className="text-sm text-muted-foreground">{format(new Date(b.birth_date), 'MMMM d, yyyy')}</p>
                        {b.birth_time && <p className="text-xs text-muted-foreground">{b.birth_time}</p>}
                      </div>
                      <Baby className="h-6 w-6 text-primary" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                      {b.baby_weight && (
                        <div className="bg-muted rounded-lg p-2">
                          <p className="text-xs text-muted-foreground">Weight</p>
                          <p className="font-medium text-sm">{b.baby_weight} lbs</p>
                        </div>
                      )}
                      {b.baby_length && (
                        <div className="bg-muted rounded-lg p-2">
                          <p className="text-xs text-muted-foreground">Length</p>
                          <p className="font-medium text-sm">{b.baby_length} in</p>
                        </div>
                      )}
                      {b.birth_type && (
                        <div className="bg-muted rounded-lg p-2">
                          <p className="text-xs text-muted-foreground">Type</p>
                          <p className="font-medium text-sm capitalize">{b.birth_type.replace(/_/g, ' ')}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {!showBirthForm ? (
            <Button onClick={() => setShowBirthForm(true)} className="w-full gradient-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" /> Record Birth
            </Button>
          ) : (
            <Card className="p-4 border-none shadow-card space-y-3">
              <h3 className="font-display font-semibold">Birth Record</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Birth Date *</label>
                  <Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Birth Time</label>
                  <Input type="time" value={birthTime} onChange={e => setBirthTime(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Baby Name</label>
                <Input value={babyName} onChange={e => setBabyName(e.target.value)} maxLength={100} placeholder="Baby's name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Weight (lbs)</label>
                  <Input type="number" value={babyWeight} onChange={e => setBabyWeight(e.target.value)} step="0.1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Length (in)</label>
                  <Input type="number" value={babyLength} onChange={e => setBabyLength(e.target.value)} step="0.1" />
                </div>
              </div>
              <Select value={birthType} onValueChange={setBirthType}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Birth Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vaginal">Vaginal</SelectItem>
                  <SelectItem value="cesarean">Cesarean</SelectItem>
                  <SelectItem value="assisted">Assisted</SelectItem>
                  <SelectItem value="water_birth">Water Birth</SelectItem>
                </SelectContent>
              </Select>
              <Select value={babyGender} onValueChange={setBabyGender}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
              <div>
                <label className="text-xs text-muted-foreground">Location</label>
                <Input value={birthLoc} onChange={e => setBirthLoc(e.target.value)} maxLength={200} placeholder="Hospital, home, etc." />
              </div>
              <Textarea placeholder="Birth notes, experience..." value={birthNotes} onChange={e => setBirthNotes(e.target.value)} maxLength={500} className="text-sm" />
              <div className="flex gap-2">
                <Button onClick={handleSaveBirth} className="flex-1">Save Birth Record</Button>
                <Button variant="outline" onClick={() => setShowBirthForm(false)}>Cancel</Button>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* POSTPARTUM TAB */}
        <TabsContent value="postpartum" className="space-y-4 mt-4">
          {latestBirth && (
            <Card className="p-4 border-none shadow-card">
              <p className="text-sm text-muted-foreground">
                {differenceInDays(new Date(), new Date(latestBirth.birth_date))} days postpartum
                {latestBirth.baby_name && ` · ${latestBirth.baby_name}`}
              </p>
            </Card>
          )}

          <Card className="p-4 border-none shadow-card space-y-4">
            <h3 className="font-display font-semibold text-sm">Today's Check-in</h3>

            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Mood</span><span>{ppMood[0]}/10</span>
              </div>
              <Slider value={ppMood} onValueChange={setPpMood} min={1} max={10} step={1} />
            </div>

            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Anxiety</span><span>{ppAnxiety[0]}/10</span>
              </div>
              <Slider value={ppAnxiety} onValueChange={setPpAnxiety} min={1} max={10} step={1} />
            </div>

            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Pain Level</span><span>{ppPain[0]}/10</span>
              </div>
              <Slider value={ppPain} onValueChange={setPpPain} min={1} max={10} step={1} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Sleep (hrs)</label>
                <Input type="number" value={ppSleep} onChange={e => setPpSleep(e.target.value)} className="text-sm" step="0.5" />
              </div>
              <Select value={ppBleeding} onValueChange={setPpBleeding}>
                <SelectTrigger className="text-sm mt-4"><SelectValue placeholder="Bleeding" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="heavy">Heavy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Breastfeeding</span>
              <Switch checked={ppBreastfeeding} onCheckedChange={setPpBreastfeeding} />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Physical Symptoms</label>
              <div className="flex flex-wrap gap-1.5">
                {PHYSICAL_PP_SYMPTOMS.map(s => (
                  <Badge
                    key={s}
                    variant={ppPhysical.includes(s) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs capitalize"
                    onClick={() => setPpPhysical(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                  >
                    {s.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Emotional Well-being</label>
              <div className="flex flex-wrap gap-1.5">
                {EMOTIONAL_PP_SYMPTOMS.map(s => (
                  <Badge
                    key={s}
                    variant={ppEmotional.includes(s) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs capitalize"
                    onClick={() => setPpEmotional(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                  >
                    {s.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            <Textarea placeholder="Notes..." value={ppNotes} onChange={e => setPpNotes(e.target.value)} maxLength={500} className="text-sm" />
            <Button onClick={handleSavePostpartum} className="w-full">Save Postpartum Log</Button>
          </Card>

          {/* Postpartum Charts */}
          {ppChartData.length >= 2 && (
            <Card className="p-4 border-none shadow-card">
              <h3 className="font-display font-semibold mb-3 text-sm">Recovery Trends</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ppChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="mood" stroke="hsl(140 30% 70%)" name="Mood" dot={false} />
                    <Line type="monotone" dataKey="anxiety" stroke="hsl(355 70% 65%)" name="Anxiety" dot={false} />
                    <Line type="monotone" dataKey="pain" stroke="hsl(25 80% 75%)" name="Pain" dot={false} />
                    <Line type="monotone" dataKey="sleep" stroke="hsl(280 40% 75%)" name="Sleep hrs" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
