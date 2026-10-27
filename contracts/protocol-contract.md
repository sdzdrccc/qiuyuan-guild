# 协议契约（Protocol Contract）

> **层**：L3 游戏侧（本仓 `contracts/`）　|　**状态**：**v0.13**（2026-10-27 **神识境界段来源订正** —— `ADR-0045`：§3.3.1 境界段的来源由「数据契约 §4.1 两列现算」改为「**§4.2 `RealmConfig.shenshi_step` 一列 · 按台阶累加**」；`shenshiPoolMax` 注明系数现值 **1** ⇒ 上限即境界段；余量结算列名订正为 `shenshi_pool_updated_ms`。★ **字段集合、消息方向、单位一律未动**；上一版 v0.12 = 2026-10-27 **技术面补全** —— `ADR-0043`：§4 补 **REST 错误码表**（0/4000/4004/4401/4403/4409/4410/4412/4503/5000）、§1 补**连接限流**（20 条/秒 · 突发 40 · 超限丢弃）、公告/版本 / HUD 布局 / 储物佩戴 / 货币余额**标 deferred**；上一版 v0.11 = **sceneId 命名规范 ＋ `delete_character` 登记为 deferred** —— `ADR-0041`：`sceneId` = **小写 snake_case** `^[a-z][a-z0-9_]*$`、缺省 **`beizhen_huaiyin`**（与实现一致；原 `main_1` 是旧默认）；`ADR-0042`：**批准做**删除角色动作，**本期标 `deferred`**（身份取会话、`confirm: true` 二次确认）；上一版 v0.10 = 神识拆两段 · ADR-0037）
> **真源**：本文件。客户端与服务端**双向**只读消费。
> **来源**：从 Codex 原型的 `MessageTypes` + `docs/03-protocol-and-api.md`（216 行）**提炼**，非新设计。
> **战略地位**：服务端**重写 Go**（已定）时，**Java 侧最有价值的产出就是本契约**（协议 + 数据表）——那 22 个 Spring 服务会被丢弃，本契约不会。

---

## 0. 三条总原则

1. **服务端权威** —— 一切结算（战斗、突破、强化、掉落、打坐累计灵力）**由服务端算**，客户端只上报意图。
   > 例外（已知）：突破为**本地即时结算 + 上报**（体验优先），服务端回 `breakthrough_result` 覆盖。
2. **推拉分离** —— 请求/响应走 `type` 配对；**广播**（他人动作）走独立 `type`，不请求也收。
3. **分线广播** —— `player_joined` / `player_move` / `player_left` / `combat_hit` / `spell_effect` 等**仅发往同场景（`sceneId`）玩家**；跨场景互不可见。

---

## 1. WebSocket（客户端 ↔ 服务端）

**路径**：`/ws`　|　**格式**：JSON（统一消息信封）

```json
{ "type": "login", "data": { "phone": "13800000000", "password": "……" } }
```

| 字段 | 规则 |
|---|---|
| `type` | **snake_case**，请求与响应不共用词表（见 §2 / §3） |
| `data` | 对象；无参数时传 `{}`（**不省略 `data`**） |
| `data` 内的字段 | ★ **一律 camelCase**（如 `accountId` / `hasCharacter` / `rootType`）—— **v0.4 新增（`ADR-0023` ⑥）**。此前只规定了 `type` 的风格，按它类推会写成 snake_case，**而写错了看不出来** |
| 连接限流 | ★ **单连接令牌桶**：稳态 **20 条/秒**、突发 **40 条**；所有消息（含 `ping`）各计 1 条；**超限静默丢弃**（不回包、不踢连接），断开时汇总日志（**v0.12 · `ADR-0043`**） |
| `sceneId` | ★ **场景/分线的逻辑 ID**：**小写 snake_case**，规则 **`^[a-z][a-z0-9_]*$`**（**v0.11 · `ADR-0041`**）。缺省 **`beizhen_huaiyin`**。★ **不是文件路径、不带 kit 前缀、不用大写/点号**；★ 一旦上线**不改名**（改名 = 一次数据迁移）；资产侧 `scene` 必须用**同一个字符串** |

**★★ 身份字段不得出现在请求体里**（**v0.4 新增 · `ADR-0023` ①**）：

**凡服务端已能从会话确定的身份信息（`accountId` / `characterId` / `roleId` …），一律以会话为准，请求体不携带。**
请求里若仍出现，服务端**直接忽略**（不读、不校验、不据此授权），并以日志记录 —— 便于发现旧客户端。

> **理由**：同一事实有两个来源时，**弱的那一个会被攻破**；而契约是各端照抄的东西，
> 它留下的冗余会被每一端各抄一遍。★ **删掉它，而不是在实现里「记得别用」。**

> ⚠️ **适用范围（★ 范围闸门 · 同 `ADR-0019` 的处置：只登记不改）**：
> 本次**只落 M1 域** —— **§2.1** 已按本条清掉 `accountId`。而 **§2.2 / §2.3** 的 `characterId`、以及
> **§2.5 物品 / §2.6 储物 / §2.7 功法任务 / §2.8 社交** 的 `characterId`，**本次一律不动**
> —— 它们属 **M2 / M5 / M7 域**，**已登记 §8 待办**。
> ★ **别顺手改**：这些段落里的 `characterId` 还牵着「角色选择 / 多角色」等未裁问题，
> 在此处一并改会**把一个协议整洁问题，扩成一次跨里程碑的语义变更**。

**鉴权**：`login_ok` 返回 `token`；`enter_world` **必须携带**；`token` 不匹配则拒绝（旧客户端未带 `token` 兼容放行）。

---

## 2. 请求类型（客户端 → 服务端）

### 2.1 账号与角色

| `type` | `data` | 说明 |
|---|---|---|
| `ping` | `{}` | 心跳 |
| `register` | `{phone, password}` | 注册（**手机号即登录标识** —— ADR-0019 ①）；`username` / `email` **已废** |
| `login` | `{phone, password}` | 登录（账号不存在则报错） |
| `resume` | `{token}` | ★ **凭令牌复原登录**（**v0.6 补登记 · `ADR-0029` ①**）。语义 = 在一条**新连接**上用上一次 `login_ok` 发下的 `token` 换回已登录会话，★ 效果与 `login` 成功**完全等价**，差别只在凭据（密码 vs 未过期令牌）。<br>★ **为什么契约此前没有它**：token 自 v0.2 就在 `login_ok` 里，但其唯一消费者 `enter_world` 属 M2 ⇒ 长期「**签了没人验**」。本条**不是发明新机制，是给已存在的机制补上唯一缺的入口**（来源：dalu 建议书 `GUILD-PROPOSAL-X0029.md`，正式号 `X-0050`）。<br>★ **`token` 是凭据，不是身份** —— 与 §2.1「身份字段不得出现在请求体」不冲突：那条禁的是 `accountId`/`characterId` 这类**声明式身份**（服务端不采信），而 `token` 是**服务端签发、服务端自己验**的凭证。 |
| `list_characters` | `{}` | 列出**本会话账号**的角色（**单角色制：长度 0 或 1** —— 裁定 B）。★ **`accountId` 已删**（v0.4 · `ADR-0023` ①）—— **身份取自会话** |
| `create_character` | `{name, gender}` | 建角（★ **`accountId` 已删** · 同上）；`gender 0=男/1=女`；**随机灵根/资质/体质/纯度**；**重名须拒**（裁定 C）。★ 其中**体质**按**灵根准入**抽 —— **有对应灵根才有概率觉醒**（**ADR-0021**）；**无对应灵根时该档池空 ⇒ 回落 = 落凡体**（**`ADR-0022`** · 见 `data-contract.md` §10.1b） |
| `logout` | `{}` | 离开世界（广播 `player_left`）并返回登录态；**会话保留**，可重新登录 |
| `delete_character` | `{confirm: true}` | ★ **批准做 · 本期 `deferred`**（**v0.11 · `ADR-0042`**）：删除**本会话当前角色**（单角色制）；`confirm` 必须是 `true`（客户端二次弹窗）；身份取会话，**不带 `accountId` / `characterId`**。★ 实现前客户端按钮保持禁用；从属数据清理范围在实现时按 `data-contract` 定 |

> ★ **v0.2 改动（ADR-0019 ①④）**：`username` / `email` → **`phone`**；`playerId` → **`accountId`**
> （与 `data-contract.md` §3.0 的 `account_id` 对齐）。
> ⚠️ **本次只对 M1 域**（§2.1~§2.3 / §3.1~§3.3）。**§2.8 社交段 / §4 REST 段仍用旧名** ——
> 属 **M7 / M17 域**，**已登记 §8 待办**（**不顺手改** · 范围闸门，ADR-0019 §「只登记不改」）。

### 2.2 世界与移动

| `type` | `data` | 说明 |
|---|---|---|
| `enter_world` | `{characterId, token, sceneId, x, y, z, rotY}` | 进世界；`sceneId` 缺省 **`beizhen_huaiyin`**（**v0.11 · `ADR-0041`**；原 `main_1` 是旧默认）；`sceneId` 须符合 §1 命名规则；名字/性别**以存档为权威** |
| `player_move` | `{x, y, z, rotY}` | 位置上报，**客户端 10Hz 节流** |

### 2.3 成长

| `type` | `data` | 说明 |
|---|---|---|
| `breakthrough` | `{characterId, mp}` | 突破上报（`mp` = 突破前灵力 —— ADR-0019 ④） |
| `get_attributes` | `{characterId}` | 查询属性面板 |
| `meditation_start` | `{characterId}` | 开始打坐（服务端累计 **2/s**，聚灵阵 **×2**） |
| `meditation_stop` | `{characterId}` | 停止并结算（返回 `meditation_result` + `character_attributes`） |

### 2.4 战斗与法术

| `type` | `data` | 说明 |
|---|---|---|
| `combat_attack` | `{skill, targetId}` | 攻击；`skill: fireball/slash`；`targetId` = 目标 sessionId；**服务端权威结算** |
| `combat_resurrect` | `{}` | 请求复活（服务端回满并广播） |
| `cast_spell` | `{spellId, targetId?, text?}` | 施法；`impact` 需 `targetId`，`telepathy` 需 `targetId` + `text` |

### 2.5 物品与装备

| `type` | `data` | 说明 |
|---|---|---|
| `get_inventory` | `{characterId}` | 背包 / 装备栏 |
| `equip_item` | `{characterId, instanceId}` | 穿戴（同槽已有装备自动换下） |
| `unequip_item` | `{characterId, slot}` | 卸下回背包；`slot 1~5` = 法器/法袍/发冠/戒指/玉佩 |
| `use_item` | `{characterId, instanceId}` | 用丹药（回血/回灵，数量 -1；**境界不足拒绝**） |
| `enhance_item` | `{characterId, instanceId}` | 强化（消耗 1 强化石；按品质上限/成功率/降级/保底） |
| `discard_item` | `{characterId, instanceId, quantity?}` | 丢弃 → **世界掉落物**（无主 + 坐标 = 角色当前位置；**不广播显示**） |
| `claim_mail` | `{characterId, mailId}` | 领邮件附件入背包（**已领取拒绝**） |

### 2.6 储物

| `type` | `data` | 说明 |
|---|---|---|
| `storage_list` | `{characterId}` | 总览（贴身栏 + 已佩戴储物法宝 + 各空间内容） |
| `storage_store` | `{characterId, itemInstanceId, targetStorageInstanceId, quantity?}` | 存入；堆叠型按件；储物法宝 = 实例占 1 格；**嵌套限 2 层 / 防环** |
| `storage_take` | `{characterId, storageInstanceId, itemId, quantity?}` | 取出到贴身空间（按件计格，**12 格**限制） |
| `storage_transfer` | `{characterId, fromStorageInstanceId, toStorageInstanceId, itemId, quantity?}` | 两储物空间间转移 |

### 2.7 功法与任务

| `type` | `data` | 说明 |
|---|---|---|
| `get_techniques` | `{characterId}` | 功法列表 |
| `upgrade_technique` | `{characterId, techniqueId}` | 消耗灵力升级；**受境界上限约束** |
| `get_tasks` | `{characterId}` | 任务列表 |
| `accept_task` | `{characterId, taskId}` | 接取 |
| `claim_task` | `{characterId, taskId}` | 领奖（灵力 + 物品；**重复领取拒绝**） |

### 2.8 社交（聊天 / 好友）

| `type` | `data` | 说明 |
|---|---|---|
| `chat_send` | `{channel, text, targetName?}` | `world`=世界(跨场景) / `scene`=附近(同场景) / `private`=私聊(按角色名) |
| `chat_history` | `{channel}` | 拉频道历史（world / scene，**各 50 条**） |
| `friend_apply` | `{playerId, targetUsername}` | 按用户名申请；对方在线实时收 `friend_notify` |
| `friend_accept` | `{playerId, fromPlayerId}` | 同意 |
| `friend_reject` | `{playerId, fromPlayerId}` | 拒绝 |
| `friend_remove` | `{playerId, friendPlayerId}` | 删除（**双向删除**） |
| `friend_list` | `{playerId}` | 好友列表 + 待处理申请 |

---

## 3. 响应类型（服务端 → 客户端）

### 3.0 通用响应（**v0.4 新增 · `ADR-0023` ③**）

| `type` | `data` | 说明 |
|---|---|---|
| `error` | `{message}` | **协议层**错误：未注册的 `type` / 畸形消息 / `data` 结构不符。★ **不改登录态、不断连接** |

**★ 与 `*_fail` 的分工（比这张表本身更重要）**：

| 情形 | 回什么 | 例子 |
|---|---|---|
| **请求本身有问题**（发错了） | `error` | 未注册的 `type`、JSON 畸形、字段类型不符 |
| **请求合法但业务上不成立**（被拒了） | 各自的 **`*_fail`** | `login_fail` / `register_fail` / `create_fail` |

> **两者混用会让客户端无法区分「我发错了」与「服务端拒绝了我」** ——
> 前者该修客户端，后者该给玩家看提示。**混在一起，客户端只能猜。**

### 3.1 账号与角色

| `type` | `data` | 说明 |
|---|---|---|
| `pong` | `{}` | 心跳回包 |
| `login_ok` | `{accountId, phone, token, hasCharacter}` | `token` = 会话鉴权；★ **`hasCharacter`** = 是否已有角色（**单角色制**下客户端据此决定进**建角屏**还是直接进游戏 —— ADR-0019 ①） |
| `login_fail` | `{message}` | 登录失败。★★ **文案与耗时都有硬要求**（**v0.4 补 · `ADR-0023` ⑦**）：<br>**（a）账号不存在** 与 **（b）密码错** ⇒ **必须回同一句**（如「账号或密码错误」），且**响应耗时也须相当** —— 否则**用时间就能枚举出哪些手机号已注册**；<br>**（c）账号存在但封禁/注销** ⇒ **具名**（如「该账号已被封禁，请联系客服」）—— 玩家要知道该申诉，而不是反复试密码。<br>★ **含糊只服务于「不可枚举」这一个目标**；**不得对不存在的账号回任何具名原因**。 |
| `register_ok` | `{accountId, phone}` | 注册成功 |
| `register_fail` | `{message}` | 注册失败 |
| `resume_ok` | `{accountId, phone, token, hasCharacter}` | ★ **形状刻意与 `login_ok` 一致**（**v0.6 补 · `ADR-0029` ①**）—— 含**新签发的 `token`**（滑动续期：复原成功即换发，旧 token 仍按 TTL 自然过期，不做吊销）。★ 客户端**不得**为它写第二套处理逻辑：**同一份 `login_ok` 处理器复用**。 |
| `resume_fail` | `{message}` | 令牌无效 / 已过期 / 账号已封禁。★ **三种原因回同一句**（同 `login_fail` 的防枚举口径 `ADR-0023` ⑦）—— ★ 不得用文案区分「token 不存在」与「token 过期」，否则又是一条枚举面。 |
| `characters` | `{accountId, characters:[...]}` | 角色列表（**单角色制：长度 0 或 1**） |
| `list_characters_fail` | `{message}` | 角色列表查询失败（**v0.5 补记 · `ADR-0027` ②** —— 该回包服务端自 M1 起就在回、客户端早已在处理，本次仅**补登记**，无行为变更） |
| `create_ok` | `{character:{...}}` | 建角成功 |
| `create_fail` | `{message}` | 建角失败 |
| `logout_ok` | `{}` | 退出确认（客户端据此回登录界面） |
| `delete_ok` | `{}` | ★ **`deferred`**（**v0.11 · `ADR-0042`**）：删除角色成功；客户端回建角屏 |
| `delete_fail` | `{message}` | ★ **`deferred`**：删除失败（未确认 / 角色不存在 / 服务端拒绝） |

### 3.2 世界与移动

| `type` | `data` | 说明 |
|---|---|---|
| `world_state` | `{players:[...]}` | 进世界后返回当前在线玩家（**不含自己**） |
| `world_enter_ok` | `{id, characterId}` | 进世界回执（`id` = **自身 sessionId**，用于判断战斗攻/受方） |
| `player_joined` | `{id, characterId, name, x, y, z, rotY}` | 有新玩家进入（广播） |
| `player_move` | `{id, x, y, z, rotY}` | 某玩家移动（广播；`id` = 对方 sessionId） |
| `player_left` | `{id}` | 某玩家离开（广播；**断线也自动广播**） |

### 3.3 成长与属性

| `type` | `data` | 说明 |
|---|---|---|
| `breakthrough_result` | `{success, chance, consumed, required, realmId, layer, mp}` | 突破结果（服务端权威） |
| `character_attributes` | 属性面板 + `equipment` 摘要 | 数值**已含装备词条与灵根增益**（`data-contract.md` §6.2）。★ **完整字段清单见 §3.3.1**（v0.7 补）；★ 面板字段**直接摊在 `data` 顶层**，不再套一层 `attributes` |
| `character_attributes_fail` | `{message}` | 属性查询被拒（未登录 / 尚无角色 / 服务端读库失败）。★ **v0.7 随 §3.3.1 一并补** —— 有了请求动作与成功包，就必须有配对的失败包，否则只能退回 §3.0 的通用 `error`，★ 而那是**协议层**（发错了）的出口，会把"业务拒绝"演成"客户端 bug" |
| `meditation_result` | `{characterId, gained, mp, maxMp, meditating}` | 打坐结算 |

> `character_attributes` 内容：气血 / 物攻 / 法攻 / 物防 / 法防 / 神识 / 命中 / 闪避 / **暴击率 / 暴击伤害 / 暴击抗性** / 格挡 / 破防 **+ 8 系元素攻抗** + `equipment`（已穿戴摘要）。
> **字段语义与公式见 `data-contract.md` §6**（本契约不重复）。
>
> ★ **v0.2 三处改动（ADR-0019 ③④⑧）**：「会心」→「**暴击**」；`spiritPower` / `maxSpiritPower` → **`mp` / `maxMp`**；
> `realmIndex` / `realmLevel` → **`realmId` / `layer`**（对齐 **ADR-0004 / ADR-0006** —— 原为**原型口径** `0~8` / `1~4`）。

#### 3.3.1 `character_attributes` 的字段清单（★ v0.6 补 · 销 §8 那条「只列了分组」的待办）

> ★★ **键名一律取 `data-contract.md` §7.2「词条键名」** —— 那张表自述是
> 「跨**配置表 / 协议 / 面板**三方共用的标识符」⇒ 本清单**不另立一名**，只把 §7.1 的
> 一级面板 18 项落到 §7.2 的键上。**发明键名 = 造第二真源。**

| 键（= §7.2 原文） | 面板名 | M1 来源 | 说明 |
|---|---|---|---|
| `maxHp` / `maxMp` | 气血 / 灵力 上限 | 境界配置 `hp_max` / `mp_max` | 与 §5.1 角色对象同名同义 |
| `physAttack` / `magAttack` | 物攻 / 法攻 | `phy_atk` / `mag_atk` | |
| `physDefense` / `magDefense` | 物防 / 法防 | `phy_def` / `mag_def` | |
| `shenshiIntensity` / `shenshiFromRealm` / `shenshiCultivation` | 神识强度 / **境界段** / **修炼段** | 境界段 = §4.2 `RealmConfig.shenshi_step` **按台阶累加**现算（★ 2026-10-27 `ADR-0045`：原 §4.1 两列已删；渡劫圆满 511000）；修炼段 = `Role.shenshi_cultivation`；强度 = 两者之和 | ★ 强度是**单值属性**，不画当前/上限；★ **两段都下发，客户端不许自己减**（那是把公式抄第二遍）。`ADR-0036` 改名 ＋ `ADR-0037` 拆段 |
| `shenshiPool` / `shenshiPoolMax` | 神识余量 / 余量上限（**消耗池**） | `Role.shenshi_pool` ＋ `Role.shenshi_pool_updated_ms`；上限 = **境界段** × 全局系数（★ `ADR-0045`：现值 **1** ⇒ 上限就是境界段本身），不落库 | ★ 上限只看境界段 ⇒ 修炼不撑池子（`ADR-0037`）。顶栏那根条画的是这一对，★ 不是强度 |
| `hit` / `dodge` | 命中 / 闪避 | `hit_rate` / `dodge_rate` | 百分比，见下方单位口径 |
| `crit` / `critDamage` / `critResist` | 暴击率 / 暴击伤害 / 暴击抗性 | `crit_rate` / `crit_dmg` / `crit_resist` | 术语已按裁定 F 统一（原「会心」） |
| `armorBreak` | 破防 | `def_break` | ⚠️ **单位待裁**（见本节末） |
| `block` / `blockDamage` | 格挡 / 格挡减伤 | `block_rate` / `block_reduce` | |
| `moveSpeed` | 移速 | `speed` | |
| `attackSpeed` / `castSpeed` | 攻速 / 施法速度 | ★ **M1 无来源** | 配置表无此列 ⇒ 填 `null`（见"缺席口径"） |
| `hp` / `mp` | 当前气血 / 灵力 | `Role.hp` / `Role.mp` | 面板要显示「当前 / 上限」，故一并给 |
| `elemAtk` / `elemRes`（**下标数组，各 8 项**）/ `elementPenetration` | 二级 · 八系攻防与元素穿透 | ★ **M1 无来源** | ★ 词根仍取 §7.2 的 `elemAtk0~7` / `elemRes0~7`，★ 但**传输形状是下标数组**（§7.2 自己写的「下标即灵根枚举」就是这个意思）⇒ 数组比 16 个平铺键少一半噪声，且下标语义不变。配置表无加成列，且双灵根取 `+20%/+10%` 还是 `+25%` **未裁** ⇒ 八个元素全 `null` |
| `equipment` | 已穿戴摘要 | ★ **M5** | M1 固定回**空数组**（★ 不是 `null` —— "没穿装备"与"没有装备系统"要能区分） |

**三条硬口径**：

1. ★ **分期只改"值从哪来"，不改"有哪些键"** —— 键集合就是上表，M1 有源的填裸值，
   无源的填 **`null`**。⇒ 客户端**不得为缺席字段造默认值**（`null` ⇒ 显示「—」或收起该行），
   ★ 也不得因为 M1 只有 16/18 就删键 —— 删键会让"服务端没升级"和"这个属性不存在"混成一件事。
2. ★ **M1 下发的是境界裸值**（`RealmLevelConfig(realmId, layer)` 那一行 ＋ 角色自身值）。
   §3.3 原注「数值**已含装备词条与灵根增益**」是**终态**描述 ⇒ 装备词条 **M5** 并入、
   灵根增益**待数值裁定**并入，★ 两者都**不改字段名**，只改服务端算法。
   ★ 所以 M1 的角色页**不许**写成"已含增益"（那是把没做的说成做了）。
3. ⚠️ **`armorBreak` 单位待裁**：配置里 `def_break` 第 3 层 = `0.30`，
   而 §7.1 把它和 `crit_rate`（`5.50` 表示 5.50%）并列在同一张百分比属性表里 ——
   ⇒ 到底是 **0.30%** 还是 **30%**，两种读法差 100 倍。★ 契约**不猜**：本字段先按配置原值下发，
   单位由 `data-contract.md` §8.2 那条裁定补，★ 已登记（`X-0051` §三）。

### 3.4 战斗与法术


| `type` | `data` | 说明 |
|---|---|---|
| `combat_hit` | `{attackerId, attackerName, targetId, targetName, skill, damage, miss, isCrit, isBlock, multiplier, targetHp, targetMaxHp, attackerXinmo, attackerKuangzao, attackerDanDu}` | 战斗命中（**全员广播**） |
| `combat_death` | `{targetId, killerId}` | 目标陨落（广播） |
| `combat_resurrect` | `{id, hp, maxHp}` | 复活回满（广播） |
| `spell_effect` | `{spell, casterId, casterName, shield/heal/hp/maxHp?, shenshiPool/shenshiPoolMax/message?}` | 法术效果广播（护盾 / 治疗 / buff ／神识探查） |
| `spell_fail` | `{message}` | 施法失败（灵力不足 / 神识余量不足 / 目标不存在…） |
| `chat_private` | `{fromId, fromName, text}` | 传音术私聊（**仅目标收到**） |
| `chat_private_sent` | `{toId, fromName, text}` | 传音回执（施法者） |

### 3.5 物品、功法、任务、社交

| `type` | `data` | 说明 |
|---|---|---|
| `inventory` | `{characterId, items:[...]}` | 背包 + 已穿戴（`slot>0` 为装备槽） |
| `enhance_result` | `{instanceId, itemId, name, quality, qualityName, enhanceMax, success, level, message, pity?, pityMax?}` | 强化结果（客户端据此刷新背包与属性面板） |
| `mail_claimed` | `{mailId, claimed}` | 邮件附件领取回执 |
| `drop_result` | `{count, items:[...]}` | 掉落结果（世界掉落物已落库：无主 + 坐标） |
| `storage` | `{characterId, body:{capacity,used}, storages:[...]}` | 储物总览 |
| `inventory_fail` | `{message, reason?}` | ★ **物品侧业务拒绝**（`get_inventory` / `use_item` / `discard_item` / `enhance_item`）——境界不足 / 冷却中 / 不可用 / 不可丢弃 / 已达上限 / 实例不属于本角色。`reason` 取 `realm` / `cooldown` / `not_usable` / `locked` / `undiscardable` / `enhance_max` / `not_owner` / `no_slot` / `not_found`（★ 客户端据此区分"该练境界"与"该等冷却"，★ 不许都显示成"操作失败"） |
| `storage_fail` | `{message, reason?}` | ★ **储物侧业务拒绝**（`storage_list` / `store` / `take` / `transfer`）——嵌套超两层 / 成环 / 容量不足 / 货币不占格 / 未认主。`reason` 取 `nest_limit` / `cycle` / `no_capacity` / `currency_no_slot` / `unbound` / `not_owner` / `not_found` |
| `techniques` | `{characterId, techniques:[...]}` | 功法列表（`techniqueId/name/level/maxLevel/desc/cost/affixes`） |
| `tasks` | `{characterId, tasks:[...]}` | 任务列表（`status 0锁定1可接2进行3可领4已领` / `progress` / `targetValue` / 奖励） |
| `chat_message` | `{channel, fromId, fromName, text, time, targetId?}` | 聊天广播（world 全员 / scene 同场景 / private 仅目标；发送者私聊回执带 `toMe=true`） |
| `chat_messages` | `{channel, messages:[...]}` | 频道历史 |
| `chat_fail` | `{message}` | 聊天失败（发言过快 / 目标不在线 / 空消息 / 未知频道） |
| `friends` | `{playerId, friends:[...], requests:[...]}` | 好友列表（`friends: playerId/username/online/sceneId`；`requests: playerId/username`） |
| `friend_notify` | `{type, fromPlayerId, fromUsername}` | 好友实时通知（`type=apply` 申请 / `accept` 同意） |
| `error` | `{message}` | 通用错误 |

---

## 4. REST API（GM 后台 ↔ 服务端）

**前缀**：`/api`　|　**统一响应信封**：

```json
{ "code": 0, "message": "ok", "data": { ... } }
```

> `code != 0` 表示失败，`message` 为错误说明。

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | → `{playerId, token}` |
| GET | `/api/players` | 玩家列表 |
| GET | `/api/players/{id}/characters` | 玩家角色列表 |
| POST | `/api/characters` | 创建角色 |
| GET | `/api/characters?keyword=&limit=&offset=` | ★ **角色列表**（GM 选人用；`keyword` 空 = 全列，否则**名字模糊或 ID 精确**；`limit` 默认 50、上限 200；只读。`data` = `{rows:[{roleId,accountId,name,realmId,layer}], total, keyword, limit, offset}` · **ADR-0035**） |
| POST | `/api/mail` | 发邮件 `{playerId, title, content, itemId, itemCount}` |
| POST | `/api/mail/claim` | 领邮件附件 |
| GET | `/api/techniques` | 功法目录（8 部，含 `perLevel` 词条） |
| GET | `/api/characters/{id}/techniques` | 角色功法（GM 查看） |
| POST | `/api/techniques/upgrade` | GM 升级功法 |
| POST | `/api/characters/{id}/realm` | **GM 调试**：设角色境界（验收神通/功法解锁） |
| GET | `/api/tasks` | 任务目录 |
| GET | `/api/characters/{id}/tasks` | 角色任务（GM 查看） |
| POST | `/api/tasks/accept` · `/api/tasks/claim` | GM 接取 / 领奖 |
| GET | `/api/items` | 物品/装备目录（条目含 `qualityName/qualityColor`、`enhanceMax`、`stackMax`） |
| POST | `/api/items` | 新增物品定义（**全服即时生效**） |
| PUT | `/api/items/{itemId}` | 编辑（**`itemId` 不可改**） |
| DELETE | `/api/items/{itemId}` | 删除（**被背包/装备引用时拒绝**） |
| POST | `/api/items/give` | GM 发物品（装备逐件、丹药/材料堆叠） |
| DELETE | `/api/items/discard` → `/api/items/discard` | 丢弃 → 世界掉落物（REST 默认主城坐标） |
| GET | `/api/instances?page&size&itemId&owner&location&unowned&q` | **物品实例统一总览**（聚合贴身/穿戴[槽位]/储物空间/无主[场景+坐标]；分页 + 组合筛选；**有主只读**） |
| PUT | `/api/instances/{id}/position` | 无主物品设位置（**有主拒绝**） |
| DELETE | `/api/instances/{id}` | 删除无主物品（**有主拒绝**） |
| DELETE | `/api/drops` | GM 清空全部无主物品 |
| GET | `/api/characters/{id}/inventory` | 角色背包（GM 查看） |
| GET | `/api/stats` | **v0.4 扩字段（`ADR-0023` ④）**：`{players, characters, mails, online, connections, loggedIn, scenes, sources}`。<br>★★ **`online` 与 `connections` 不是一回事，不许互相冒充**：<br>　**`online`** = **世界中在线人数** —— **已进入世界（`enter_world` 成功）的角色**（**游戏语义**）；<br>　**`connections`** = **当前 WebSocket 连接数**（含未登录）（**网络层事实**）；**`loggedIn`** = 其中已完成登录的。<br>　★ 登录了但没进图的玩家**只算后者** —— 用一个冒充另一个，会让「在线人数」在不同页面给出不同答案。<br>`scenes` = 分线在线统计。`sources` = **逐指标交代数据来路**的附加字段；<br>　★ **没有来源的指标回 `null`，不回 `0`** —— `0` 是「查过了，结果为零」，`null` 才是「我没有这个数」。 |
| GET | `/api/gm/config` | **v0.4 新增（`ADR-0023` ⑤）**：配置表清单 —— `{sourceDir, count, tables:[{name, rows, columns}], note}` |
| GET | `/api/gm/config/{table}` | **v0.4 新增（`ADR-0023` ⑤）**：单张配置表的行数据 —— `{name, columns, rows}`；表不存在回 **404**（★ 不是空数组 —— 「没这张表」与「这张表是空的」是两回事） |

### 4.1 统一信封与错误码（**v0.12 · `ADR-0043`**）

响应统一为 `{code, message, data}`；`code = 0` 成功，非 0 见下表（★ 与 WS 侧 §3.0 的 `error` 分工：**REST 用业务码，WS 用 `type`**）：

| code | 含义 |
|---|---|
| `0` | 成功 |
| `4000` | 参数不合法（含方法不对） |
| `4004` | 资源不存在（如配置表名 / 角色 ID） |
| `4401` | 未登录 / 会话过期 |
| `4403` | 无权限（或写入口未开启） |
| `4409` | 表源版本冲突（别人先改了 CSV） |
| `4410` | 删除前还有引用，需要二次确认 |
| `4412` | 必须先修改初始密码 |
| `4503` | 数据源尚未就绪（★ 与「值为 0」严格区分） |
| `5000` | 服务端内部错误 |

> ★ **`4004` 与 `4503` 不是一回事**：前者「你问的东西不存在」，后者「我这块还没装配」；★ 不得把「未装配」回成 404，也不得把「不存在」回成 200 + 空对象。

---

## 5. 关键对象结构

### 5.1 角色对象

```json
{
  "id": 1, "accountId": 1, "name": "云中子", "gender": 0,
  "realmId": 1, "layer": 3,
  "mp": 320.0, "maxMp": 320.0,
  "exp": 7320.0, "expMax": 9000.0,
  "roots": [
    { "rootType": 4, "purity": 88.0, "sortOrder": 0 },
    { "rootType": 0, "purity": 72.0, "sortOrder": 1 }
  ],
  "spiritualRootQuality": 3,
  "bodyTier": 1, "bodyName": "风雷冰灵体",
  "origin": "Origin.NorthZhen.Huaiyin",
  "xinmo": 12.5, "kuangzao": 8.0, "danDu": 0.0,
  "shenshiIntensity": 19.0,
  "shenshiPool": 190.0, "shenshiPoolMax": 190.0,
  "hp": 100.0, "maxHp": 100.0
}
```

> ★ **`exp` / `expMax` 是 v0.6 补登记（`ADR-0029` ②）** —— 修为值与其上限。
> **`exp` 落库**（`data-contract.md` §3.1 `Role.exp`，「突破用」），**`expMax` 不落库** —— 它 = **当前境界配置的 `exp_max`**，
> ★ 与 `origin` / `maxHp` / `maxMp` 同属「**由配置派生、只出现在协议视图**」那一类（理由见下方 `origin` 那条：
> ★ 把派生字段塞进 `Role` 会造出双真源）。
> ★★ **`exp` ≠ `mp`** —— 修为（突破）与灵力（施法）是两个独立资源（`data-contract.md` §3.1 注），
> ★ 历史上合并过一次又拆开 ⇒ 客户端**不得**拿 `mp` 当 `exp` 显示。
>
> ★ **`origin` 是 v0.4 新增（`ADR-0023` ⑧）** —— 出身。取值 `Origin.NorthZhen.Huaiyin`（M1 唯一）；
> **真源 = 下游全局配置的 `origin_tag` 键**（**物理落点见 `qiuyuan-dalu/docs/DATA-LAYOUT.md`** · `ADR-0027` ① —— 契约不含物理映射），**由配置派生、不落库**。
>
> ★★ **它为什么不进 `data-contract.md` §3.1 `Role`** —— 因为**这两份契约回答的不是同一个问题**：
>
> | 契约 | 回答 |
> |---|---|
> | `data-contract.md` §3.1 `Role` | **落库存哪些字段** |
> | **本节（`protocol-contract.md` §5.1）** | **客户端看到哪些字段** |
>
> ⇒ **派生而不落库的字段（`origin`、`maxHp` / `maxMp` …）只属于后者。**
> ★ 把派生字段塞进 `Role` 会**造出双真源**（存一份、配置一份，迟早不一致）。

**枚举**：全部**引用 `data-contract.md`**，本契约不重复定义。

| 字段 | 取值 | 权威处 |
|---|---|---|
| `rootType` | `0~7` = 金木水火土风雷冰 | `data-contract.md` §0 勘误一 |
| `realmId` | **`1~9`** = 炼气…渡劫（`0` = 凡人，未入道） | `data-contract.md` §4 · **ADR-0006** |
| `layer` | 炼气 `1~10`；其余 **`1~9`**（第 9 层 = **圆满**） | `data-contract.md` §4 · **ADR-0004** |
| `spiritualRootQuality` | `0~6`（编号按「神通 + 修炼」**双单调**重排 —— 裁定 K） | `data-contract.md` §3.2 |
| `bodyTier` | `0~3` | `data-contract.md` §3.1 |
| `roots[].purity` | **`1~100`**（均匀随机，**与品级无关** —— 裁定 G） | `data-contract.md` §3.2 |
| `roots[].sortOrder` | **`0` = 主灵根 = 纯度最高者** | `data-contract.md` §3.2 |
| `origin` | ★ **出身标签** | **v0.4 新增（`ADR-0023` ⑧）**。M1 唯一取值 `Origin.NorthZhen.Huaiyin`；**真源 = 下游全局配置的 `origin_tag` 键**（物理落点见 `qiuyuan-dalu/docs/DATA-LAYOUT.md` · `ADR-0027` ①），**由配置派生、不落库**（故**不在** `data-contract.md` §3.1 `Role` 里 —— 见下方说明） |
| `exp` / `expMax` | 修为值 / **当前境界**突破所需修为（`expMax` **派生自境界配置，不落库**） | `data-contract.md` §3.1（`exp` 列）· §境界配置 `exp_max` · ★ **v0.6 补登记（`ADR-0029` ②）** |
| `shenshiIntensity` | **神识强度 = 境界段 ＋ 修炼段 —— ★ 单值，不是「当前/上限」对** | `data-contract.md` §3.1（影响术法 / 施法速度 / 突破小加成 / 炼艺成功率）· ★ **v0.6 记此一条防再错（`ADR-0029` ④）**：它是**属性**不是**资源池**，界面**不得**画成 `420/520` 那种进度条；★ **ADR-0036 改名**（原 `shenshi`）· ★ **ADR-0037 拆两段**：明细走 §3.3.1 的 `shenshiFromRealm` / `shenshiCultivation`（角色对象只给总和） |
| `shenshiPool` / `shenshiPoolMax` | **神识余量 / 余量上限（消耗池）** | `data-contract.md` §3.1（`shenshi_pool`）＋ §3.3（`shenshi_pool_factor`）· ★ **ADR-0036 新增**：上限派生、不落库；顶栏那根「神识余量」条画的是这一对，不是强度。★ **ADR-0037**：上限的输入是**境界段**（不是总强度） |

> ✅ **灵力命名已统一（v0.2 · ADR-0019 ④）**：字段由 **`spiritPower` → `mp`**（上限 `maxMp`）——
> 与 `data-contract.md` §3.1 的同名字段一致。**原「两个名字指同一资源」的状态已消除**
> （此处原自陈「M1 须统一并落 ADR」—— **本条即那个 ADR**）。
> ★ **同处一并勘误（ADR-0019 ⑧）**：`realmIndex` / `realmLevel` → **`realmId` / `layer`**，
> 取值由**原型口径**（`0~8` / `1~4`）改回 **ADR-0004 / ADR-0006 的裁定值**（`1~9` / `1~9`）。

### 5.2 世界玩家对象

```json
{ "id": "e822cc42-...", "characterId": 3, "name": "云中子", "gender": 0,
  "x": 0.0, "y": 1.0, "z": 0.0, "rotY": 0.0 }
```

> `id` = **服务端 WebSocket sessionId**，是本次世界的唯一身份。
> **客户端无需知道自己的 id**，只按收到的 `id` 创建 / 更新 / 移除远端玩家。

### 5.3 背包物品对象

```json
{
  "instanceId": 12, "itemId": "wp_qingfengjian", "name": "清风剑",
  "type": 0, "slot": 0, "defSlot": 1, "quantity": 1, "requiredRealm": 0,
  "desc": "以玄铁铸就的轻盈长剑，剑身清鸣如风。",
  "affixes": { "physAttack": 15, "attackSpeed": 5, "hit": 5 },
  "use": {}, "bound": false
}
```

> **`affixes` 的键名必须与属性面板键名逐字相同** —— 权威清单见 `data-contract.md` §7.2。
> 元素攻/抗用 `elemAtk0~7` / `elemRes0~7`（**下标即灵根枚举**）。
> 词条值为**品质倍率 × 强化加成后的生效值**。

---

## 6. 法术与技能

### 6.1 基础法术（10 种，`cast_spell`）

| `spellId` | 名称 | 类型 | 效果 |
|---|---|---|---|
| `shield` | 灵力护盾 | 防御 | 消耗灵力生成护盾，**受击先扣盾** |
| `impact` | 灵力冲击 | 攻击 | 远程法术伤害，与灵力/法攻挂钩 |
| `lightstep` | 轻身术 | 辅助 | 移速/闪避提升（buff 广播） |
| `detect` | 神识探查 | 辅助 | 以神识扫过四周 · **消耗神识余量上限的 5%**（ADR-0036 已实装；目标清单随场景内容补） |
| `control` | 御物术 | 通用 | 操控物品攻击（**占位**） |
| `spiritarray` | 聚灵阵 | 辅助 | 提升修炼速度（buff 广播；打坐 ×2） |
| `telepathy` | 传音术 | 辅助 | 私密传音给指定玩家 |
| `stealth` | 隐匿术 | 辅助 | 隐藏气息（**占位**） |
| `fasting` | 辟谷术 | 辅助 | 无需进食（**占位**） |
| `heal` | 基础疗伤术 | 治疗 | 回复生命（上限 = 最大生命） |

### 6.2 本命神通

ID 格式 **`inn_<root>_<tier>`**（如 `inn_huo_1` = 火系火球术）。
**仅主灵根可施放**；随境界解锁（炼气=0 / 筑基=1 / 金丹=3）。
完整规则见 `data-contract.md` §5.1。

### 6.3 功法

ID 格式 **`gong_<root>`**（`gong_jin` / `gong_mu` / `gong_shui` / `gong_huo` / `gong_tu` / `gong_feng` / `gong_lei` / `gong_bing`）。
详见 `data-contract.md` §5.2。

---

## 7. 客户端联机流程

```
登录界面 → login → login_ok → 角色选择 → list_characters / create_character → 进入游戏
  1. enter_world（带初始位置）→ 服务端回 world_state，并向他人广播 player_joined
  2. 客户端 10Hz 上报 player_move → 服务端广播给他人
  3. 收到 world_state / player_joined → 生成远端玩家（胶囊体 + 头顶名字）
     收到 player_move → 更新目标点做插值
     收到 player_left → 移除
  4. 断线时服务端自动广播 player_left
```

**突破闭环**：菜单修炼页 / 技能轮盘触发 → **本地即时结算** + `breakthrough` 上报 → `breakthrough_result` 同步服务端权威数据。

---

## 8. 待办（按里程碑补全 · 见 `docs/ROADMAP.md`）

- [x] ✅ **统一 `spiritPower` / `mp` 命名** —— **已办（2026-09-30 · ADR-0019 ④）**：改为 `mp` / `maxMp`
- [x] ✅ **`realmIndex` / `realmLevel` → `realmId` / `layer`** —— **已办（同批 · ADR-0019 ⑧）**，对齐 ADR-0004 / ADR-0006
- [ ] ★ **`playerId` / `targetUsername` 等旧名统一**（**§2.8 社交段 / §4 REST 段**）——
      与 `data-contract.md` 的 `Account` / `Role` 命名对齐。属 **M7 / M17 域**，**M1 不碰**
      （ADR-0019 §「只登记不改」—— 判据：**发现缺口 ≠ 顺手改**）
- [ ] ★ **身份字段出请求体**（**v0.4 登记 · `ADR-0023` ①**）—— §2.1 **已清**；
      **§2.2 / §2.3 的 `characterId`、§2.5 物品 / §2.6 储物 / §2.7 功法任务 / §2.8 社交 的 `characterId` 仍在**。
      属 **M2 / M5 / M7 域** ⇒ **只登记不改**（同 `ADR-0019` 的范围闸门）。
      ★ **别顺手改**：那些段落的 `characterId` 还牵着「角色选择 / 多角色」等未裁问题，
      一并改会把**协议整洁问题扩成跨里程碑的语义变更**。
- [x] ✅ **确认 REST 的错误码表** —— **已办（2026-10-27 · `ADR-0043`）**：见 **§4.1**（`0/4000/4004/4401/4403/4409/4410/4412/4503/5000`）
- [ ] **公告 / 版本动作** —— ★ **`deferred`**（`ADR-0043`）：归 M7/M9，本轮不补契约
- [ ] **HUD 布局切换（classic / adjusted）** —— ★ **`deferred`**（`ADR-0043`）：归 UI 批
- [ ] **储物法宝佩戴 / 卸下** —— ★ **`deferred`**（`ADR-0043`）：M5 再补动作
- [ ] **货币余额归属** —— ★ **`deferred`**（`ADR-0043`）：M5 再定（当前不占格、无归属字段）
- [ ] 为每条消息补**字段类型与必填性**（当前多数仅有字段名）
- [x] ✅ **补 `character_attributes` 的完整字段清单** —— **已办（2026-10-18 · `X-0051` / `ADR-0030`）**：
      见 **§3.3.1**（键名全部取 `data-contract.md` §7.2「词条键名」，★ 不另立一名）。
      ★ 连带留下两条**新的**待裁口径（不在本条范围内）：`armorBreak` 的百分比单位 ·
      寿元是否进一级面板（现按"不进"处理，§3.3.1 未列 `life`）。
- [x] ✅ **确认 `sceneId` 命名规范** —— **已办（2026-10-27 · `ADR-0041`）**：小写 snake_case `^[a-z][a-z0-9_]*$`，
      缺省 **`beizhen_huaiyin`**；与 `asset-ref-contract.md` §5.2 联动（同一字符串）。见 §1 表 / §2.2
- [ ] **实现 `delete_character`** —— ★ **已批准做，本期 `deferred`**（`ADR-0042`）：契约登记请求/回包，
      客户端按钮**保持禁用**；实现时定从属数据清理范围（不阻塞当前里程碑）
- [ ] 核对剩余「占位」法术（`control` / `stealth` / `fasting`）在正式工程是否保留（`detect` 已随 `ADR-0036` 实装）
- [ ] 评估 WebSocket 是否需**消息版本协商**（旧客户端兼容靠「未带 token 放行」，不是长久之计）
- [ ] **客户端段协议的分层差**（**M2 前须裁**）—— 本契约 §1 定 **WS + JSON**；上游《技术架构》**§3.2** 定客户端走 **TCP + UDP/KCP + Protobuf**（商业化期双通道）。
      判为「**分阶段**」（原型期务实选择 vs 目标形态）**而非冲突**，但**上游未写明这句过渡** → 须补。**不阻塞 M1**（M1 照 §1 走即可）。见 **ADR-0014** §附带。

---

## 9. 变更记录

> 本文件早期版本只有头部一行版本号，**没有变更台账**。**v0.4 起补上** ——
> 理由与 `data-contract.md` 同：**改契约的人需要一处能按版本倒查「改了什么」的地方**，
> 而头部那一行写不下两版以上的内容。

| 版本 | 日期 | 变更 |
|---|---|---|
| **v0.13** | **2026-10-27** | ★ **神识境界段来源订正**（`DECISIONS.md` **ADR-0045** · 数据契约 **v0.14** 同批 · 下游卡 `T-0148`／`T-0149`）：① §3.3.1 `shenshiFromRealm` 的来源由「数据契约 §4.1 两列（起点＋增量）现算」改为「**§4.2 `RealmConfig.shenshi_step` 一列 · 从炼气一层按台阶累加**」（★ 层次表不再有神识列）；② `shenshiPoolMax` 的系数注明**现值 1** ⇒ **上限 = 境界段本身**（大人裁「余量上限 = 境界段」）；③ 余量结算列名订正 `shenshi_pool_updated_at` → **`shenshi_pool_updated_ms`**（随下游命名规范：epoch 毫秒 ⇒ `_ms`）。★ **未新增/删除字段 · 未改消息方向 · 未改单位**：`shenshiIntensity` / `shenshiFromRealm` / `shenshiCultivation` / `shenshiPool` / `shenshiPoolMax` 五个键原样，只是数出来的**量级**变了（建角 10 → 100、炼气三层 14 → 300、渡劫圆满 511000）。 |
| **v0.12** | **2026-10-27** | ★ **技术面补全**（`ADR-0043` · 卡 `X-0073`）：① §4 新增 **§4.1 统一信封与错误码表**（10 个业务码，含 `4004` vs `4503` 的区分）；② §1 新增**连接限流**（单连接 20 条/秒 · 突发 40 · 超限静默丢弃）；③ §8 勾销 REST 错误码待办，登记 **公告/版本 · HUD 布局 · 储物佩戴 · 货币余额** 四项 `deferred`。★ 未改任何既有消息方向与字段语义。 |
| **v0.11** | **2026-10-27** | ★ **sceneId 命名规范 ＋ `delete_character` 登记 deferred**（`ADR-0041` / `ADR-0042` · 卡 `X-0072`）：① §1 新增 `sceneId` 规则 —— **小写 snake_case** `^[a-z][a-z0-9_]*$`、缺省 **`beizhen_huaiyin`**（原 `main_1` 是旧默认）、上线不改名、资产侧同字符串；② §2.1 新增 **`delete_character {confirm:true}`**、§3.1 新增 `delete_ok` / `delete_fail`，★ **批准做但本期 `deferred`**（身份取会话、客户端按钮暂禁用）；③ §8 勾销 sceneId 待办、新增 delete_character 实现待办。★ 未改既有字段语义 · 未新增其它消息方向。 |
| **v0.10** | **2026-10-25** | ★ **神识拆两段 ＋ 上限改挂境界段**（`DECISIONS.md` **ADR-0037** · 卡 `X-0061` · 数据侧 `data-contract.md` v0.11 同笔）：① §3.3.1 新增 **`shenshiFromRealm` / `shenshiCultivation`** —— 强度 = 境界段 ＋ 修炼段，★ 两段都下发，★ 客户端不得自己减（把公式抄第二遍是本仓老坑）；② **`shenshiPoolMax` 的输入换成境界段**（`上限 = 境界段 × shenshi_pool_factor`）⇒ **修炼段不撑池子**；③ §5.1 角色对象仍只给总和 `shenshiIntensity`（明细归面板包）；④ ★ `ADR-0029` ④ 与 `ADR-0036` 的改名**全部保留**，★ 未新增消息方向 · 未改既有字段语义。 |
| **v0.9** | **2026-10-25** | ★ **神识字段改名 ＋ 余量池**（`DECISIONS.md` **ADR-0036**）—— ① §3.3.1 `character_attributes` 的 `shenshi` → **`shenshiIntensity`**，新增 **`shenshiPool` / `shenshiPoolMax`**；② §5.1 `character` 对象同步（强度单值 ＋ 余量池）；③ §3.4 `spell_effect` 增三个可选字段 **`shenshiPool` / `shenshiPoolMax` / `message`**，§6.1 `detect`（神识探查）由「占位」转**已实装**，消耗 = 余量上限的 5%；④ 口径：**强度是属性、余量是消耗池**；上限 = 强度 × 全局系数、**不落库**；⑤ ★ `ADR-0029` ④ **不变**：强度仍不得画成 `420/520`；顶栏那根条画的是余量。★ 未新增消息方向 · 未改既有字段语义。 |
| **v0.8** | **2026-10-20** | ★ **M5 物品批：补两条业务拒绝回包**（`DECISIONS.md` **ADR-0034** · 卡 `X-0058` 追加 · 下游 `T-0115`）—— §3.5 加 **`inventory_fail`** ＋ **`storage_fail`**（各带 `reason` 枚举）。<br>**为什么补**：`ADR-0023` ③ 定了分工 —— 协议层错误回 `error`、**业务不成立回 `*_fail`**；而 §2.5 / §2.6 那九个物品与储物动作**只有成功下行**（`inventory` / `enhance_result` / `storage`），拒绝**无处可回**。★ 后果不是"少一条消息"，是**服务端只能把"境界不足"和"冷却中"都说成"操作失败"**，客户端无法区分（判据 2 要的就是这个区分）。<br>**三条口径**：① ★ **不改九个动作的请求体与成功回包**（只加拒绝侧）；② `reason` 是**机器码**、`message` 是**给人看的话**，两者**都要带** —— 只给文案，客户端就得靠中文字符串分支（本仓老坑同型）；③ ★ 物品侧**不新增下行成功包**（`use_item` 成功仍走 §3.5 `inventory` 刷新，不另立 `use_ok`）。<br>★ **§2.2~§2.8 一字未动 · 未新增消息方向 · 未改任何既有字段语义 · ADR 纯追加**。 |
| **v0.7** | **2026-10-18** | ★ **角色页前置包**（`DECISIONS.md` **ADR-0030** · 卡 `X-0051`）——「继续把服务端和界面打通」推进到**角色页（属性面板）**时，撞上 §8 那条一直开着的待办：`character_attributes` **只列了分组、没有字段清单** ⇒ 双端各写一套键名只是时间问题。<br>**① 新增 §3.3.1 完整字段清单**：一级面板 18 项 ＋ `hp`/`mp` 当前值 ＋ 二级八系 ＋ `equipment`。★ **键名一律照抄 `data-contract.md` §7.2「词条键名」**（该表自述就是"跨配置表/协议/面板三方共用的标识符"）⇒ ★ 本清单不另立一名，发明键名 = 造第二真源。<br>**② 三条硬口径**：**分期只改"值从哪来"、不改"有哪些键"**（M1 有源的填裸值、无源填 `null`，★ 客户端不得造默认值、也不得因 M1 只有 16/18 就删键）· **M1 只发境界裸值**（§3.3 原注"已含装备词条与灵根增益"是**终态**描述 ⇒ 装备 M5 并入、灵根增益待裁并入，★ 都不改字段名）· **`armorBreak` 单位待裁**（配置 `def_break=0.30` 与 `crit_rate=5.50`（=5.50%）并列在同一张百分比表里 ⇒ 0.30% 还是 30% 差 100 倍，★ 契约不猜）。<br>**③ 销 §8 一条待办**，★ 同时**新登记两条**待裁（`armorBreak` 单位 · 寿元是否进一级面板）。<br>★ **未改**任何既有消息的方向与语义 · §2 请求表一字未动（`get_attributes` v0.2 就在） · 未新增里程碑。 |
| **v0.6** | **2026-10-17** | ★ **M1 打通前置包**（`DECISIONS.md` **ADR-0029** · 卡 `X-0050`）——「把服务端和界面打通」开工前实测出的三处账实不符，**一次清完**：<br>**① §2.1 / §3.1 补 `resume` / `resume_ok` / `resume_fail`** —— 双端**早已实现并跑通**（服务端 `login/handler.go` 已登记、客户端登录屏在用），但契约全文 `resume` **0 命中** ⇒ ★ token 长期「签了没人验」。来源 dalu 建议书 `GUILD-PROPOSAL-X0029.md`（自留号 0029 从未入台账 ⇒ **正式号 X-0050**）。★ 并写清它与 §2.1「身份字段不得出现在请求体」**不冲突**：那条禁的是声明式身份，`token` 是服务端自发自验的凭据。<br>**② §5.1 补 `exp` / `expMax`** —— 修为值落库（`data-contract.md` §3.1 `Role.exp`）、上限**派生自境界配置 `exp_max`** 故不落库；此前协议视图没暴露 ⇒ 客户端 HUD 的「道」栏**无真值可接**。★ 顺带明记 **`exp` ≠ `mp`**（历史上合并过一次又拆开）。<br>**③ §5.1 明记 `shenshi` 是单值属性**（神识强度，非资源池）—— 下游画稿把它画成了 `420/520` 进度条 ⇒ 记一条防再错；界面须跟随契约，不是契约跟随画稿。<br>**④ 端口登记**（★ 不属本契约，但同一批账）：游戏服务端实占 **8080** 而唯一真源 `gbe-assets/catalog/ports.json` **从无此条**，且该文件把 8080 保留给了 `deferred` 的 unity-mcp ⇒ 登记 `qiuyuan-game-ws: 8080`，★ 并把**没人用的** unity 预留挪到 8090（挪预留，不动在听的生产端口）。<br>★ **未改**任何既有字段的语义 · **未新增消息方向** · §2.2~§2.8 一字未动。 |
| **v0.5** | **2026-10-13** | ★ **契约收紧 + 补记**（`DECISIONS.md` **ADR-0027**）：<br>**① §2.1 / §5.1 摘除 2 处物理表名**（`qydl_game_config.origin_tag` → 「下游全局配置的 `origin_tag` 键」+ 物理落点指针）—— 落实 `ADR-0001` 规矩 1「契约不含物理映射」，消掉两处必腐的跨层重复；<br>**② §3.1 补 `list_characters_fail` 行**（补记：服务端早已在回、客户端早已在处理，仅补登记）。 |
| **v0.4** | **2026-10-01** | ★ **M1 契约补齐包**（`DECISIONS.md` **ADR-0023**）—— 一次集中处理下游三张记录（`T-0022` / `T-0023` / `T-0024`）**§契约回执**累计上报的 **8 处**缺口：<br>**① §1/§2.1 身份字段出请求体**（`create_character` / `list_characters` 去掉 `accountId`；§1 加「身份一律取自会话」+ **范围闸门**：其余段落的 `characterId` 只登记不改）—— **安全缺口**；<br>**② §2.1 同步「回落 = 落凡体」**（原写「待裁」，与 `data-contract.md` v0.7 矛盾）；<br>**③ §3.0 新增通用 `error`**（原缺「协议层错误」回包的定义）+ 写明与 `*_fail` 的分工；<br>**④ §4 `/api/stats` 扩字段** —— `connections` / `loggedIn` / `sources`，并**明文区分 `online`（已进世界）与 `connections`（连着的人）**；<br>**⑤ §4 新增 `/api/gm/config` 与 `/api/gm/config/{table}`**（GM 读配置表）；<br>**⑥ §1 补「`data` 内字段一律 camelCase」**；<br>**⑦ §3.1 `login_fail` 补「防枚举」的完整要求** —— 文案与**耗时**双相当 + 封禁账号**具名**的三段式；<br>**⑧ §5.1 角色对象新增 `origin`**，并说明它**为何不进** `data-contract.md` 的 `Role`（**存什么** vs **看什么**，两份契约回答两个问题）。<br>★ **本节起补上变更记录**。 |
| **v0.3** | **2026-09-30** | 体质灵根准入（`ADR-0021`） |
| **v0.2** | **2026-09-30** | M1 契约对齐（`ADR-0019`）：`{phone, password}` · `accountId` · `mp` / `maxMp` · §5.1 `realmId` · `layer` |
| **v0.1** | （原型期） | 从 Codex 原型 `MessageTypes` + `docs/03-protocol-and-api.md` 提炼 |
