# BIllyBot Backend
## Headers
```
authorization: 'Bearer xxxxx'
x-api-timestamp: 'xxxxx'
```
---
## Methods
```
/api/v*/
```
<details>
<summary>/developer</summary>
<p>

- `GET` /ping
</p>
</details>
---
<details>
<summary>/users</summary>
<p>

- `POST` /
	```ts
	{
		server_id: string;
		user_id: string;
		username: string;
		discriminator: string;
		billy_bucks?: number;
		avatar_hash?: string;
	}[]
	```
</p>
<p>

- `GET` /server/`server_id`
</p>
<p>

- `GET` /?user_id=`string`&server_id=`string`
</p>
<p>

- `DELETE` /server/`server_id`
</p>
</details>
---
<details>
<summary>/metrics</summary>
<p>

- `GET` /server/`server_id`
	```
	?posts=0|1
	&reactions_used=0|1
	&reactions_received=0|1
	&mentions=0|1
	```
</p>
<p>

- `PUT` /
	```ts
	{
		server_id: string;
        user_id: string;
		metrics: {
			posts?: number;
			reactions_used?: number;
			reactions_received?: number;
			mentions?: number;
		}
	}[]
	```
</p>
</details>
---
